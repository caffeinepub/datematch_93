export function detectInterestsFromBio(
  bio: string,
  interests: readonly string[],
): string[] {
  const lowerBio = bio.toLowerCase();
  return interests
    .filter((interest) => lowerBio.includes(interest.toLowerCase()))
    .slice(0, 8);
}
