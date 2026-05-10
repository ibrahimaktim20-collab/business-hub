'use client'

import { useEffect, useRef, useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useCompany } from '@/hooks/useCompany'
import { createClient } from '@/lib/supabase/client'
import { formatFileSize } from '@/lib/utils'
import {
  FolderOpen, FolderPlus, Upload, File, Trash2,
  ChevronRight, Home, Download, Search,
} from 'lucide-react'
import type { FileFolder, FileItem } from '@/types/database'

const FILE_ICONS: Record<string, string> = {
  'image/': '🖼️', 'video/': '🎬', 'audio/': '🎵',
  'application/pdf': '📄', 'application/zip': '🗜️',
  'text/': '📝', 'application/': '📦',
}

function getFileIcon(type: string) {
  for (const [prefix, icon] of Object.entries(FILE_ICONS)) {
    if (type.startsWith(prefix)) return icon
  }
  return '📄'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function FilesPage() {
  const { activeCompany } = useCompany()
  const company = activeCompany()
  const [folders, setFolders] = useState<FileFolder[]>([])
  const [files, setFiles] = useState<FileItem[]>([])
  const [currentFolder, setCurrentFolder] = useState<FileFolder | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<FileFolder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function load(folderId?: string) {
    setLoading(true)
    const supabase = createClient()
    const [fRes, iRes] = await Promise.all([
      supabase.from('file_folders').select('*').eq('company_id', company.id)
        .eq('parent_id', folderId ?? null as any).order('name'),
      supabase.from('file_items').select('*').eq('company_id', company.id)
        .eq('folder_id', folderId ?? null as any).order('name'),
    ])
    setFolders(fRes.data ?? [])
    setFiles(iRes.data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    setCurrentFolder(null)
    setBreadcrumbs([])
    load()
  }, [company.id])

  function openFolder(folder: FileFolder) {
    setCurrentFolder(folder)
    setBreadcrumbs(prev => [...prev, folder])
    load(folder.id)
  }

  function navigateBreadcrumb(index: number) {
    if (index < 0) {
      setCurrentFolder(null)
      setBreadcrumbs([])
      load()
    } else {
      const folder = breadcrumbs[index]
      setCurrentFolder(folder)
      setBreadcrumbs(prev => prev.slice(0, index + 1))
      load(folder.id)
    }
  }

  async function createFolder() {
    if (!newFolderName.trim()) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('file_folders').insert({
      company_id: company.id,
      name: newFolderName.trim(),
      parent_id: currentFolder?.id,
      user_id: user!.id,
    } as any)
    setNewFolderName('')
    setNewFolderOpen(false)
    load(currentFolder?.id)
  }

  async function deleteFolder(id: string) {
    const supabase = createClient()
    await supabase.from('file_folders').delete().eq('id', id)
    setFolders(prev => prev.filter(f => f.id !== id))
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const path = `${company.id}/${currentFolder?.id ?? 'root'}/${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('files').upload(path, file)
    if (!error) {
      await supabase.from('file_items').insert({
        company_id: company.id,
        folder_id: currentFolder?.id,
        name: file.name,
        size: file.size,
        type: file.type,
        storage_path: path,
        user_id: user!.id,
      } as any)
      load(currentFolder?.id)
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function deleteFile(item: FileItem) {
    const supabase = createClient()
    await supabase.storage.from('files').remove([item.storage_path])
    await supabase.from('file_items').delete().eq('id', item.id)
    setFiles(prev => prev.filter(f => f.id !== item.id))
  }

  async function downloadFile(item: FileItem) {
    const supabase = createClient()
    const { data } = await supabase.storage.from('files').download(item.storage_path)
    if (!data) return
    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = item.name
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredFolders = folders.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
  const isEmpty = filteredFolders.length === 0 && filteredFiles.length === 0

  return (
    <div>
      <TopBar title="Files">
        <Button size="sm" variant="outline" onClick={() => setNewFolderOpen(true)}>
          <FolderPlus className="h-4 w-4" />New Folder
        </Button>
        <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          <Upload className="h-4 w-4" />{uploading ? 'Uploading…' : 'Upload'}
        </Button>
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
      </TopBar>

      <div className="p-6 space-y-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-sm text-zinc-500">
          <button onClick={() => navigateBreadcrumb(-1)} className="flex items-center gap-1 hover:text-zinc-900 transition-colors">
            <Home className="h-3.5 w-3.5" />
            <span>All Files</span>
          </button>
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.id} className="flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5" />
              <button
                onClick={() => navigateBreadcrumb(i)}
                className={i === breadcrumbs.length - 1 ? 'font-medium text-zinc-900' : 'hover:text-zinc-900 transition-colors'}
              >
                {crumb.name}
              </button>
            </span>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input placeholder="Search files…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-zinc-100 animate-pulse" />)}
          </div>
        ) : isEmpty ? (
          <div className="text-center py-16 text-zinc-400">
            <FolderOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">This folder is empty</p>
            <p className="text-xs mt-1">Upload files or create a folder to get started</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredFolders.map(folder => (
              <Card key={folder.id} className="cursor-pointer hover:border-zinc-300 transition-colors group" onClick={() => openFolder(folder)}>
                <CardContent className="p-4 flex items-center gap-3">
                  <FolderOpen className="h-8 w-8 text-amber-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">{folder.name}</p>
                    <p className="text-xs text-zinc-400">{formatDate(folder.created_at)}</p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); deleteFolder(folder.id) }}
                    className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-all p-1 rounded"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </CardContent>
              </Card>
            ))}
            {filteredFiles.map(item => (
              <Card key={item.id} className="group">
                <CardContent className="p-4 flex items-center gap-3">
                  <span className="text-2xl flex-shrink-0">{getFileIcon(item.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">{item.name}</p>
                    <p className="text-xs text-zinc-400">{formatFileSize(item.size)} · {formatDate(item.created_at)}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => downloadFile(item)} className="text-zinc-400 hover:text-zinc-700 p-1 rounded">
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => deleteFile(item)} className="text-zinc-400 hover:text-red-500 p-1 rounded">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Folder Name</Label>
            <Input
              placeholder="My Folder"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createFolder()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderOpen(false)}>Cancel</Button>
            <Button onClick={createFolder} disabled={!newFolderName.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}