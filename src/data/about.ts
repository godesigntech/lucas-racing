export interface Value {
  title: string
  body: string
}

export const values: Value[] = [
  {
    title: "Approve first",
    body: "Every helmet starts with a proof you sign off. If it's not right on screen, it doesn't go in the tank.",
  },
  {
    title: "Racers, not resellers",
    body: "Lucas Racing is a working race team. We design for how a helmet looks at 60 mph in the rain.",
  },
  {
    title: "Made in the UK",
    body: "Masking, dipping, chrome and lacquer are all done in our own workshop.",
  },
  {
    title: "Back the next generation",
    body: "Hydro Karts is run by the next generation of the sport, with the backing of the Lucas Racing team.",
  },
]

export interface TeamMember {
  role: string
  name: string
  bio: string
}

// Placeholder team entries until the client supplies names, photos and bios.
export const team: TeamMember[] = [
  {
    role: "Team principal",
    name: "Lucas Racing",
    bio: "Runs the race team and the business behind it. Name and photo to be added.",
  },
  {
    role: "Hydro Karts",
    name: "The twins",
    bio: "The young racers behind every dip, mask and finish. Names and photo to be added.",
  },
  {
    role: "Workshop",
    name: "Chrome and lacquer",
    bio: "In-house chrome, clear coat and final detailing. Team details to be added.",
  },
]
