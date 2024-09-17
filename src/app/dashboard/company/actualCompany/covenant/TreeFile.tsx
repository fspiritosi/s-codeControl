'use client';
import AddCategoryModal from '@/components/AddCategoryModal';
import AddCovenantModal from '@/components/AddCovenantModal';
import AddGuildModal from '@/components/AddGuildModal';
import { ChevronDown, ChevronRight, FileText, FolderClosed, FolderOpen } from 'lucide-react';
import React, { useState } from 'react';

export interface TreeNodeData {
  name: string;
  id: string;
  children?: TreeNodeData[];
  type: 'sindicato' | 'convenio' | 'sindicatoPadre' | 'categoria';
}

interface TreeNodeProps {
  node: TreeNodeData;
  level: number;
}

export const TreeNode: React.FC<TreeNodeProps> = ({ node, level }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => setIsOpen(!isOpen);

  const renderIcon = () => {
    if (node.children) {
      return isOpen ? (
        <FolderOpen className="h-4 w-4 text-yellow-500" />
      ) : (
        <FolderClosed className="h-4 w-4 text-yellow-500" />
      );
    }
    return <FileText className="h-4 w-4 text-blue-500" />;
  };

  return (
    <div className="">
      <div
        className={`flex items-center p-1 hover:bg-accent rounded cursor-pointer ${level === 0 ? 'font-semibold' : ''}`}
        style={{ paddingLeft: `${level * 20}px` }}
      >
        <div className="flex justify-between w-full">
          <div className="flex items-center gap-2 flex-grow" onClick={toggleOpen}>
            {node.children && (isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
            {renderIcon()}
            <span>{node.name}</span>
          </div>

          <div className="">
            {node.type === 'sindicatoPadre' && <AddGuildModal />}
            {node.type === 'sindicato' && <AddCovenantModal guildInfo={{ name: node.name, id: node.id }} />}
            {node.type === 'convenio' && <AddCategoryModal covenantInfo={{ name: node.name, id: node.id }} />}
          </div>
        </div>
      </div>
      {isOpen && node.children && (
        <div>
          {node.children.map((child, index) => (
            <TreeNode key={crypto.randomUUID()} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};
