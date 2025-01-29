import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { FileCode, Folder, ChevronRight, ChevronDown } from 'lucide-react';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  parentId: string | null;
  content?: string;
  language?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TreeItem extends FileItem {
  children: TreeItem[];
}

interface FileTreeProps {
  onFileSelect: (file: FileItem) => void;
  currentFileContent?: string;
  selectedFileId?: string | null;
}

export default function FileTree({ onFileSelect, currentFileContent, selectedFileId: externalSelectedFileId }: FileTreeProps) {
  const [treeData, setTreeData] = useState<TreeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFileId, setSelectedFileId] = useState<string | null>(externalSelectedFileId || null);
  const [lastSavedContent, setLastSavedContent] = useState<string>('');

  useEffect(() => {
    loadFiles();
  }, []);

  // Autosave effect
  useEffect(() => {
    if (!selectedFileId || !currentFileContent || currentFileContent === lastSavedContent) {
      return;
    }

    const timeoutId = setTimeout(() => {
      handleSaveContent(selectedFileId, currentFileContent);
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [currentFileContent, selectedFileId, lastSavedContent]);

  const handleSaveContent = async (fileId: string, content: string) => {
    if (!auth.currentUser) return;

    try {
      const fileRef = doc(db, 'users', auth.currentUser.uid, 'files', fileId);
      await updateDoc(fileRef, {
        content,
        updatedAt: new Date()
      });
      setLastSavedContent(content);
    } catch (err) {
      console.error('Error saving file:', err);
      setError('Failed to save file');
    }
  };

  const buildTreeData = (files: FileItem[]): TreeItem[] => {
    const itemsById = new Map<string, TreeItem>();
    const root: TreeItem[] = [];

    // First, convert all items to TreeItems
    files.forEach(file => {
      itemsById.set(file.id, { ...file, children: [] });
    });

    // Then, build the tree structure
    itemsById.forEach(item => {
      if (item.parentId === null) {
        root.push(item);
      } else {
        const parent = itemsById.get(item.parentId);
        if (parent) {
          parent.children.push(item);
        }
      }
    });

    // Sort items: folders first, then by name
    const sortItems = (items: TreeItem[]) => {
      items.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
      items.forEach(item => {
        if (item.children.length > 0) {
          sortItems(item.children);
        }
      });
    };

    sortItems(root);
    return root;
  };

  const loadFiles = async () => {
    if (!auth.currentUser) {
      setError('No user logged in');
      return;
    }

    setLoading(true);
    try {
      const filesRef = collection(db, 'users', auth.currentUser.uid, 'files');
      const q = query(filesRef);
      const querySnapshot = await getDocs(q);
      
      const files: FileItem[] = [];
      querySnapshot.forEach((doc) => {
        files.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        } as FileItem);
      });

      const tree = buildTreeData(files);
      setTreeData(tree);
      setError(null);

      // Auto-expand folders containing the selected file
      if (selectedFileId) {
        const expandFoldersToFile = (items: TreeItem[], fileId: string): boolean => {
          for (const item of items) {
            if (item.id === fileId) return true;
            if (item.type === 'folder' && item.children.length > 0) {
              if (expandFoldersToFile(item.children, fileId)) {
                setExpandedFolders(prev => new Set(prev).add(item.id));
                return true;
              }
            }
          }
          return false;
        };
        expandFoldersToFile(tree, selectedFileId);
      }
    } catch (err) {
      console.error('Error loading files:', err);
      setError('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

//   const handleCreateFolder = async () => {
//     if (!auth.currentUser) return;
    
//     const folderName = prompt('Enter folder name:');
//     if (!folderName) return;
    
//     try {
//       const filesRef = collection(db, 'users', auth.currentUser.uid, 'files');
//       await addDoc(filesRef, {
//         name: folderName,
//         type: 'folder',
//         parentId: null,
//         createdAt: new Date(),
//         updatedAt: new Date()
//       });
      
//       await loadFiles();
//     } catch (err) {
//       console.error('Error creating folder:', err);
//       setError('Failed to create folder');
//     }
//   };

  const handleCreateFile = async (parentId: string | null = null) => {
    if (!auth.currentUser) return;
    
    const fileName = prompt('Enter file name (e.g., example.ts):');
    if (!fileName) return;
    
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    // const extensionByName = fileName.slice(-3).toLowerCase();
    const languageMap: { [key: string]: string } = {
      'ts': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'tsx': 'typescript',
      'json': 'json',
      'md': 'markdown',
      'css': 'css',
      'html': 'html',
      'py': 'python',
    };
    
    try {
      const filesRef = collection(db, 'users', auth.currentUser.uid, 'files');
      const newFile = await addDoc(filesRef, {
        name: fileName,
        type: 'file',
        parentId,
        content: '// Start coding here',
        language: languageMap[extension] || 'plaintext',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await loadFiles();
      
      // Auto-select the newly created file
      const fileData = {
        id: newFile.id,
        name: fileName,
        type: 'file' as const,
        parentId,
        content: '// Start coding here',
        language: languageMap[extension] || 'plaintext',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setSelectedFileId(newFile.id);
      onFileSelect(fileData);
    } catch (err) {
      console.error('Error creating file:', err);
      setError('Failed to create file');
    }
  };

  const handleDelete = async (id: string) => {
    if (!auth.currentUser) return;
    
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const deleteRecursive = async (itemId: string) => {
        // Get all children
        const filesRef = collection(db, 'users', auth.currentUser!.uid, 'files');
        const q = query(filesRef, where('parentId', '==', itemId));
        const querySnapshot = await getDocs(q);
        
        // Delete all children recursively
        for (const doc of querySnapshot.docs) {
          await deleteRecursive(doc.id);
          await deleteDoc(doc.ref);
        }
        
        // Delete the item itself
        await deleteDoc(doc(db, 'users', auth.currentUser!.uid, 'files', itemId));
      };
      
      await deleteRecursive(id);
      
      if (selectedFileId === id) {
        setSelectedFileId(null);
        onFileSelect({ id: '', name: '', type: 'file', parentId: null, content: '', createdAt: new Date(), updatedAt: new Date() });
      }
      
      await loadFiles();
    } catch (err) {
      console.error('Error deleting item:', err);
      setError('Failed to delete item');
    }
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const renderTreeItem = (item: TreeItem, level: number = 0) => {
    const isExpanded = expandedFolders.has(item.id);
    const isSelected = selectedFileId === item.id;
    
    return (
      <div key={item.id} className="select-none">
        <div
          className={`flex items-center gap-2 py-1 px-2 hover:bg-[#2d2d2d] cursor-pointer
            ${isSelected ? 'bg-[#37373d]' : ''}`}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
          onClick={() => {
            if (item.type === 'folder') {
              toggleFolder(item.id);
            } else {
              setSelectedFileId(item.id);
              onFileSelect(item);
              setLastSavedContent(item.content || '');
            }
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            if (confirm('Delete this item?')) {
              handleDelete(item.id);
            }
          }}
        >
          {item.type === 'folder' && (
            <span className="w-4">
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </span>
          )}
          {item.type === 'folder' ? (
            <Folder size={16} className="text-[#dcb67a]" />
          ) : (
            <FileCode size={16} className="text-[#519aba]" />
          )}
          <span className="flex-1">{item.name}</span>
          {item.type === 'folder' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCreateFile(item.id);
              }}
              className="opacity-0 group-hover:opacity-100 hover:text-white text-[#cccccc]"
            >
              +
            </button>
          )}
        </div>
        {item.type === 'folder' && isExpanded && (
          <div>
            {item.children.map(child => renderTreeItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-1 flex flex-col w-full px-3">
      <div className="flex gap-2">
        {/* <button
          onClick={handleCreateFolder}
          className="flex items-center justify-center gap-2 w-full px-4 py-2 hover:bg-[#2d2d2d] text-[#cccccc]"
        >
          <Folder size={16} />
          <span>New Folder</span>
        </button> */}
        <button
          onClick={() => handleCreateFile(null)}
          className="flex items-center justify-center gap-2 w-full px-4 py-2 hover:bg-[#2d2d2d] text-[#cccccc]"
        >
          <FileCode size={16} />
          <span>New File</span>
        </button>
      </div>

      {error && (
        <div className="text-red-500 text-sm px-4 py-2">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-[#cccccc] text-sm px-4 py-2">
          Loading...
        </div>
      ) : (
        <div className="mt-4">
          {treeData.map(item => renderTreeItem(item))}
        </div>
      )}
    </div>
  );
}