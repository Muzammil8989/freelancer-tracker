'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Share2, Copy, Trash2, Check, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

type ShareLink = {
  id: string
  label: string | null
  token: string
  created_at: string
}

export function ShareProjectDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false)
  const [shares, setShares] = useState<ShareLink[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [label, setLabel] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fetchShares = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/shares?project_id=${projectId}`)
    setLoading(false)
    if (res.ok) setShares(await res.json())
  }, [projectId])

  useEffect(() => {
    if (open) fetchShares()
  }, [open, fetchShares])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    const res = await fetch('/api/shares', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, label: label || undefined }),
    })
    setCreating(false)
    if (res.ok) {
      const data = await res.json()
      setShares(prev => [data, ...prev])
      setLabel('')
      const shareUrl = data.share_url || `${window.location.origin}/share/${data.token}`
      navigator.clipboard.writeText(shareUrl).catch(() => {})
      toast.success('Share link created and copied to clipboard')
    } else {
      const data = await res.json()
      toast.error(data.error ?? 'Failed to create share link')
    }
  }

  async function handleRevoke(shareId: string) {
    const res = await fetch(`/api/shares/${shareId}`, { method: 'DELETE' })
    if (res.ok) {
      setShares(prev => prev.filter(s => s.id !== shareId))
      toast.success('Share link revoked')
    } else {
      toast.error('Failed to revoke share link')
    }
  }

  async function handleCopy(share: ShareLink) {
    const url = `${window.location.origin}/share/${share.token}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(share.id)
      setTimeout(() => setCopiedId(null), 2000)
      toast.success('Copied to clipboard')
    } catch {
      toast.error('Could not copy to clipboard')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Project</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Label (optional)</Label>
              <Input
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="e.g. Client review, Stakeholder view"
                maxLength={100}
              />
            </div>
            <Button type="submit" className="w-full" disabled={creating}>
              {creating ? 'Creating...' : 'Generate Share Link'}
            </Button>
          </form>

          {(loading || shares.length > 0) && <Separator />}

          {loading && (
            <p className="text-sm text-muted-foreground text-center">Loading...</p>
          )}

          {!loading && shares.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Active links ({shares.length})
              </p>
              {shares.map(share => (
                <div
                  key={share.id}
                  className="flex items-center justify-between gap-2 p-3 rounded-lg border"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {share.label ?? 'Untitled link'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(share.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                      <a
                        href={`/share/${share.token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Preview"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleCopy(share)}
                      title="Copy link"
                    >
                      {copiedId === share.id ? (
                        <Check className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRevoke(share.id)}
                      title="Revoke"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && shares.length === 0 && (
            <p className="text-xs text-center text-muted-foreground py-2">
              No active share links. Generate one above.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
