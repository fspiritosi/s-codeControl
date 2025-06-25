'use client';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { useState } from 'react';
import { fetchAllTags } from '../../actions/actions';
import TagForm from './tagForm';
import AreaTable from './tagTable';

function TagTab({ tags }: { tags: Awaited<ReturnType<typeof fetchAllTags>> }) {
  const [selectedTag, setSelectedTag] = useState<Awaited<ReturnType<typeof fetchAllTags>>[number] | null>(null);
  const [mode, setMode] = useState<'create' | 'edit'>('create');

  return (
    <div>
      <ResizablePanelGroup direction="horizontal" className="min-h-[400px]">
        <ResizablePanel defaultSize={40}>
          <TagForm
            tags={tags}
            mode={mode}
            setMode={setMode}
            selectedTag={selectedTag}
            setSelectedTag={setSelectedTag}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={60}>
          <AreaTable
            tags={tags}
            selectedTag={selectedTag}
            setSelectedTag={setSelectedTag}
            setMode={setMode}
            mode={mode}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
export default TagTab;
