interface ArtifactList {
  data: {
    total_count: number
    artifacts: Array<{
      id: number
      node_id: string
      name: string
      size_in_bytes: number
      url: string
      archive_download_url: string
      expired: boolean
      created_at: string
      updated_at: string
      expires_at: string
      workflow_run: {
        id: number
        repository_id: number
        head_repository_id: number
        head_branch: string
        head_sha: string
      }
    }>
  }
}
