"use client";
import { useState, useEffect, MouseEvent } from "react";
import { auth } from "../firebase";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import FileTree from "./FileTree";
import CodeEditor from '../../components/codeEditor';
import { FileItem } from "../types";

export default function Dashboard() {
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [isResizing, setIsResizing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [currentContent, setCurrentContent] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const handleAuth = () => {
      if (!auth.currentUser) {
        // router.push("/");
        console.log('not logged in!')
      }
    };

    handleAuth();
    const unsubscribe = auth.onAuthStateChanged(handleAuth);
    return () => unsubscribe();
  }, [router]);

  const startResizing = (mouseDownEvent: MouseEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizing(true);
  };

  const stopResizing = () => {
    setIsResizing(false);
  };

  const resize = (mouseMoveEvent: MouseEvent) => {
    if (isResizing) {
      const newWidth = mouseMoveEvent.clientX;
      if (newWidth >= 160 && newWidth <= 480) {
        setSidebarWidth(newWidth);
      }
    }
  };

  useEffect(() => {
    window.addEventListener("mousemove", resize as unknown as EventListener);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener(
        "mousemove",
        resize as unknown as EventListener
      );
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing]);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleFileSelect = (file: FileItem) => {
    console.log(file)
    setSelectedFile(file);
    setCurrentContent(file.content || '');
  };

  // Update current content when editor changes
  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCurrentContent(value);
    }
  };

  return (
    <div className="flex h-screen bg-[#1e1e1e] text-[#d4d4d4] overflow-hidden font-mono">
      {/* Sidebar */}
      <aside
        style={{ width: `${sidebarWidth}px`, minWidth: `${sidebarWidth}px` }}
        className="flex flex-col bg-[#252526] border-r border-[#3d3d3d]"
      >
        {/* User Info */}
        <div className="p-4 border-b border-[#3d3d3d]">
          <div className="flex flex-col items-center gap-1">
            <span className="text-xl truncate w-full text-center text-green-500">
              {auth.currentUser?.displayName || "User"}
            </span>
            <span className="text-xs truncate w-full text-center text-gray-500">
              {auth.currentUser?.email || ""}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4">
          <FileTree 
            onFileSelect={handleFileSelect} 
            currentFileContent={currentContent}
            selectedFileId={selectedFile?.id || null}
          />
        </nav>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 p-4 hover:bg-[#2d2d2d] border-t border-[#3d3d3d]"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </aside>

      {/* Resize Handle */}
      <div
        onMouseDown={startResizing}
        className={`w-1 cursor-col-resize hover:bg-[#0078d4] active:bg-[#0078d4] group relative
          ${isResizing ? "bg-[#0078d4]" : "bg-transparent"}`}
      >
        {/* Handle overlay for easier grabbing */}
        <div className="absolute top-0 left-[-2px] w-[5px] h-full group-hover:bg-[#0078d4] opacity-0" />
      </div>

      {/* Main Content */}
      <main className="flex-1 h-full overflow-hidden">
        {selectedFile ? (
          <CodeEditor
            value={selectedFile.content || ''}
            language={'javascript'}
            onChange={handleEditorChange}
          />
        ) : (
          <div className="flex p-6 overflow-auto items-center w-full h-full justify-center">
            <div className="font-black text-[150px] opacity-5">{"<codeLog />"}</div>
          </div>
        )}
      </main>
    </div>
  );
}