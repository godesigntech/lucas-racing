export interface TeamMember {
  id: string
  name: string
  role: string
  /** One line shown under the name on cards. */
  tagline: string
  /** Paragraphs of the full introduction. */
  bio: string[]
  photoUrl: string | null
  photoAlt: string
  /** Shown in the homepage team section. */
  featured: boolean
  isActive: boolean
  sortOrder: number
}
