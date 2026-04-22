import React, { useState } from "react";

function FileUploadBox({ onFileLoad }: { onFileLoad: (file: File) => void }) {
  const [dragOver, setDragOver] = useState<boolean>(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      if (files[0].name.endsWith(".step") || files[0].name.endsWith(".stp")) {
        onFileLoad(files[0]);
      } else {
        alert("Please upload a .step or .stp file");
      }
    }
  };

  const handleClick = () => {
    document.getElementById("fileInput")?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileLoad(file);
    }
  };

  return (
    <div
      className="bg-gray-50 p-3 absolute left-0 top-0 z-30 h-full w-full cursor-pointer"
      onClick={handleClick}
    >
      <input
        type="file"
        id="fileInput"
        accept=".step,.stp"
        style={{ display: "none" }}
        onChange={handleInputChange}
      />
      <div
        className={`rounded-lg text-gray-800 border-gray-300 gap-5 flex h-full w-full shrink-0 flex-col items-center justify-center border-4 ${
          dragOver ? "border-solid" : "border-dashed"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <span className="text-xl font-bold">
          Drag STEP Files Here or Click to Upload
        </span>
      </div>
    </div>
  );
}

export default FileUploadBox;
