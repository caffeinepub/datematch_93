export type InterestCategory = { name: string; items: string[] };

export const INTEREST_CATEGORIES: InterestCategory[] = [
  {
    name: "Outdoors",
    items: [
      "Hiking",
      "Running",
      "Cycling",
      "Rock Climbing",
      "Surfing",
      "Skiing",
      "Swimming",
      "Kayaking",
      "Camping",
      "Bouldering",
      "Skateboarding",
      "Snowboarding",
    ],
  },
  {
    name: "Sports & Fitness",
    items: [
      "Fitness",
      "Yoga",
      "Dancing",
      "Gym",
      "Pilates",
      "CrossFit",
      "Martial Arts",
      "Boxing",
      "Weightlifting",
    ],
  },
  {
    name: "Team Sports",
    items: [
      "Football",
      "Basketball",
      "Soccer",
      "Tennis",
      "Volleyball",
      "Baseball",
      "Rugby",
      "Cricket",
      "Hockey",
    ],
  },
  {
    name: "Mind Sports",
    items: ["Chess", "Poker", "Go", "Puzzles", "Trivia", "Sudoku", "Debate"],
  },
  {
    name: "Food & Drink",
    items: [
      "Cooking",
      "Baking",
      "Coffee",
      "Wine",
      "Cocktails",
      "Foodie",
      "Vegan",
      "Sushi",
    ],
  },
  {
    name: "Arts & Culture",
    items: [
      "Music",
      "Art",
      "Photography",
      "Film",
      "Movies",
      "Writing",
      "Theatre",
      "Dance",
      "Poetry",
      "Architecture",
      "Museums",
    ],
  },
  {
    name: "Music",
    items: [
      "Guitar",
      "Piano",
      "DJing",
      "Singing",
      "Concerts",
      "Festivals",
      "Hip-Hop",
      "Jazz",
      "Classical",
      "EDM",
    ],
  },
  {
    name: "Entertainment",
    items: [
      "Gaming",
      "Anime",
      "Board Games",
      "Reading",
      "Podcasts",
      "Streaming",
      "Cosplay",
      "Comics",
      "Esports",
    ],
  },
  {
    name: "Lifestyle",
    items: [
      "Travel",
      "Fashion",
      "Meditation",
      "Volunteering",
      "Gardening",
      "Languages",
      "Crafts",
      "Tech",
      "Sustainability",
      "Minimalism",
      "Astrology",
      "Wellness",
    ],
  },
  {
    name: "Pets",
    items: ["Dogs", "Cats", "Birds", "Fish", "Reptiles"],
  },
];

// Flat list — used for bio detection and backward compat
export const INTERESTS_LIST = INTEREST_CATEGORIES.flatMap((c) => c.items);

export const QUIZ_QUESTIONS: {
  question: string;
  options: [string, string, string, string];
}[] = [
  {
    question: "Your ideal Saturday morning is...",
    options: [
      "Sleeping in as long as possible",
      "Early gym session + coffee",
      "Farmers market + slow brunch",
      "Spontaneous road trip",
    ],
  },
  {
    question: "Social energy: you are...",
    options: [
      "Total introvert — recharge alone",
      "Mostly introverted, selectively social",
      "Mostly extroverted, love people",
      "Full extrovert — the more the merrier",
    ],
  },
  {
    question: "Your relationship with punctuality...",
    options: [
      "Always 10 minutes early",
      "On time, every time",
      "5–15 minutes late, pretty regularly",
      "Time is a suggestion",
    ],
  },
  {
    question: "Conflict in a relationship: you prefer...",
    options: [
      "Talk it out right away",
      "Cool off first, then discuss",
      "Avoid it if possible",
      "Passionate argument, then move on",
    ],
  },
  {
    question: "Travel style?",
    options: [
      "Fully planned itinerary",
      "Light plan, lots of flexibility",
      "Pure spontaneous — figure it out there",
      "Prefer staying home",
    ],
  },
  {
    question: "Your ideal Friday night?",
    options: [
      "Board games / movie at home",
      "Dinner and a bar with close friends",
      "Concert, club, or live event",
      "Whatever comes up last minute",
    ],
  },
  {
    question: "Money and relationships...",
    options: [
      "Split everything 50/50 always",
      "Take turns paying",
      "Whoever earns more covers more",
      "One person manages finances together",
    ],
  },
  {
    question: "Ambition level?",
    options: [
      "Career is central to my identity",
      "I work to live, not live to work",
      "Side projects and passion work matter most",
      "Just want stability and comfort",
    ],
  },
  {
    question: "Pets?",
    options: [
      "Love them — the more the better",
      "One pet is perfect",
      "I like other people's pets",
      "Not a pet person",
    ],
  },
  {
    question: "Long distance could work for me...",
    options: [
      "Absolutely, love makes it worth it",
      "Short-term only with a clear end date",
      "Very unlikely",
      "No way",
    ],
  },
];

export const ICEBREAKER_PROMPTS = [
  "My ideal weekend looks like...",
  "A fact about me that surprises people...",
  "The hobby I can't stop talking about...",
  "My go-to comfort food is...",
  "Something on my bucket list...",
  "The best place I've ever visited...",
  "I'm weirdly passionate about...",
  "The show I keep recommending...",
];

export const MAX_REPORTS_BEFORE_FLAG = 5;
export const MAX_NAME_LEN = 15;
export const MAX_BIO_LEN = 500;
export const MIN_INTERESTS = 3;
export const MAX_INTERESTS = 10;
export const MAX_ICEBREAKERS = 3;
export const MIN_AGE = 18;
export const MAX_AGE = 120;
