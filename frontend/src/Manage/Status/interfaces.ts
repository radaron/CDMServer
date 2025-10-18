export interface Torrent {
  id: number
  name: string
  progress: number
  status:
    | 'seeding'
    | 'downloading'
    | 'stopped'
    | 'error'
    | 'complete'
    | 'queued'
  detailsUrl?: string
}
