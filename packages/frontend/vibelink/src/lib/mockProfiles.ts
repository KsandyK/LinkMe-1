export interface Profile {
  id: string;
  name: string;
  age: number;
  location: string;
  bio: string;
  live: boolean;
  avatar: string;
  followers: string;
  joined: string;
}

export const mockProfiles: Profile[] = [
  { id: "profile-1", name: "Luna Rose", age: 24, location: "Miami, FL", bio: "Your Miami sunshine 🌞 Live every night", live: true, avatar: "🌺", followers: "12.4k", joined: "Jan 2024" },
  { id: "profile-2", name: "Alex Storm", age: 28, location: "New York, NY", bio: "NYC nightlife & deep conversations 💜", live: true, avatar: "🌃", followers: "8.9k", joined: "Mar 2023" },
  { id: "profile-3", name: "Jade Rivera", age: 26, location: "Los Angeles, CA", bio: "LA dreamgirl ✨ Art, vibes & authenticity", live: false, avatar: "🌴", followers: "15.2k", joined: "Sep 2023" },
  { id: "profile-4", name: "Marcus Vane", age: 31, location: "Chicago, IL", bio: "Chicago smooth 🎷 Late night vibes", live: true, avatar: "🎷", followers: "6.7k", joined: "Nov 2023" },
  { id: "profile-5", name: "Seraphina Kiss", age: 23, location: "Las Vegas, NV", bio: "Vegas royalty 👑 Luxury vibes, real energy", live: true, avatar: "🎰", followers: "21.3k", joined: "Jul 2023" },
  { id: "profile-6", name: "Dante Cruz", age: 29, location: "Miami, FL", bio: "Miami nights, real talks 🌙 2000+ fans", live: true, avatar: "🌙", followers: "18.1k", joined: "Feb 2024" },
  { id: "profile-7", name: "Nova Wilde", age: 25, location: "Austin, TX", bio: "Austin indie soul 🎸 Music, mystery & magic", live: false, avatar: "🎸", followers: "9.4k", joined: "Dec 2023" },
  { id: "profile-8", name: "Kai Phoenix", age: 27, location: "Seattle, WA", bio: "Seattle rain & real energy 🌧️", live: false, avatar: "🌧️", followers: "7.8k", joined: "Aug 2023" },
  { id: "profile-9", name: "Isabella Storm", age: 22, location: "New York, NY", bio: "NYC's sweetheart ☕ Coffee, chaos & charm", live: true, avatar: "☕", followers: "11.6k", joined: "Apr 2024" },
  { id: "profile-10", name: "Ryker Dean", age: 33, location: "Dallas, TX", bio: "Dallas alpha energy 👑 Real talk, no filter", live: false, avatar: "🔥", followers: "14.9k", joined: "Oct 2023" },
];
