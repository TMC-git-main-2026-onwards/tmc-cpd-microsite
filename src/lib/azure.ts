import {
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  SASProtocol,
} from '@azure/storage-blob'

// Server-only. Generates a short-lived, read-only SAS URL for a video in the
// private course-videos container. Called from the dashboard after the auth
// check, so anonymous visitors never receive a link, and the URL expires.
const account = import.meta.env.AZURE_STORAGE_ACCOUNT
const accountKey = import.meta.env.AZURE_STORAGE_KEY
const container = import.meta.env.AZURE_STORAGE_CONTAINER || 'course-videos'

export function getVideoSasUrl(blobName: string, expirySeconds = 60 * 60): string {
  if (!account || !accountKey) {
    throw new Error('Azure storage env not set (AZURE_STORAGE_ACCOUNT / AZURE_STORAGE_KEY)')
  }
  const credential = new StorageSharedKeyCredential(account, accountKey)
  const now = Date.now()
  const sas = generateBlobSASQueryParameters(
    {
      containerName: container,
      blobName,
      permissions: BlobSASPermissions.parse('r'),
      protocol: SASProtocol.Https,
      startsOn: new Date(now - 5 * 60 * 1000), // small clock-skew allowance
      expiresOn: new Date(now + expirySeconds * 1000),
    },
    credential,
  ).toString()
  return `https://${account}.blob.core.windows.net/${container}/${encodeURIComponent(blobName)}?${sas}`
}
