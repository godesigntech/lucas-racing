export interface GalleryPhoto {
  id: string
  albumId: string
  imageUrl: string
  caption: string
  width: number | null
  height: number | null
  sortOrder: number
}

export interface GalleryAlbum {
  id: string
  slug: string
  title: string
  event: string
  /** ISO date (yyyy-mm-dd) of the race weekend or event. */
  albumDate: string | null
  description: string
  /** The chosen cover, or the first photo. */
  coverUrl: string | null
  isPublished: boolean
  sortOrder: number
  photoCount: number
}

export interface GalleryAlbumWithPhotos extends GalleryAlbum {
  photos: GalleryPhoto[]
}
