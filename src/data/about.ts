// Copy for the About page, supplied by Lucas Racing.

export interface TeamMember {
  name: string
  role: string
  /** Short pull line shown under the name. */
  tagline: string
  bio: string[]
}

export const family: TeamMember[] = [
  {
    name: "Howard Lucas",
    role: "Founder",
    tagline: "The man behind the team",
    bio: [
      "Howard is the founder and driving force behind Lucas Racing. With decades of hands-on racing experience, he has built a reputation for understanding exactly what makes a competitive kart.",
      "From chassis preparation and technical development to race-day decisions and helping drivers find those crucial tenths of a second, his knowledge has been developed where it matters most: at the circuit.",
      "His approach has always been straightforward: work hard, do things properly and give people the support they need to succeed.",
    ],
  },
  {
    name: "Connor Lucas",
    role: "Racer",
    tagline: "Leading by example",
    bio: [
      "For Connor, karting has always been part of family life. Growing up around circuits, race teams and competitive motorsport, he has developed into an accomplished racer with a wealth of practical experience.",
      "What makes Connor so important to Lucas Racing is his willingness to help others, whether that's supporting younger drivers, sharing advice, helping with kart preparation or encouraging someone after a difficult race.",
      "As the next generation of Lucas Racing, Connor carries forward the family's passion, knowledge and commitment to the people around them.",
    ],
  },
  {
    name: "Wendy Lucas",
    role: "Team manager",
    tagline: "The heart of the team",
    bio: [
      "Howard's wife and Connor's mum, Wendy is the person who holds everything together behind the scenes.",
      "While the team is busy preparing karts, chasing lap times and competing on the circuit, Wendy is looking after the people who make it all possible, from organising the little details to making sure drivers and their parents are welcomed, looked after and, importantly, well fed.",
      "Her contribution might not appear on the timing sheets, but everyone involved knows just how important she is.",
    ],
  },
]

export interface Value {
  title: string
  body: string
}

export const values: Value[] = [
  {
    title: "Young drivers",
    body: "Need encouragement. We help them build confidence and enjoy the sport as much as the results.",
  },
  {
    title: "Parents",
    body: "Need reassurance. You're welcomed, looked after and kept in the loop, at the circuit and away from it.",
  },
  {
    title: "Experienced racers",
    body: "Need reliable equipment and knowledgeable support, from people who race the same kit they sell.",
  },
  {
    title: "Everyone",
    body: "Is part of the family. When you race with Lucas Racing, you're never just another number on the grid.",
  },
]

export const services: string[] = [
  "New MS Kart racing chassis and complete karts",
  "Genuine MS Kart spare parts and components",
  "Kart preparation and setup advice",
  "Technical support and performance guidance",
  "Specialist knowledge of sprint and endurance racing",
  "Support for drivers at every stage of their racing journey",
]

export const milestones: { value: string; label: string }[] = [
  { value: "30 yrs", label: "Nearly three decades in competitive karting" },
  { value: "1999", label: "Working with MS Kart since" },
  { value: "Le Mans", label: "Multiple 24 Hours victories, plus the UK 24 Hours" },
]
