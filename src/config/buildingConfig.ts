export interface MarkerData {
  id: string
  title: string
  description: string
  position: [number, number, number]
  videoUrl: string
}

// Small, fast-loading placeholder video
const PLACEHOLDER_VIDEO = 'https://pub-d91108a6d61c4699bbf1f5aa4cbe6572.r2.dev/videos/sacred-video.mp4'

export const buildingConfig = {
  markers: [
    {
      id: 'lobby',
      title: 'Main Lobby',
      description: 'The grand entrance featuring marble floors and a stunning chandelier.',
      position: [0, 1, 2],
      videoUrl: PLACEHOLDER_VIDEO,
    },
    {
      id: 'office',
      title: 'Office Floor',
      description: 'Modern open-plan workspace with panoramic city views.',
      position: [1, 3, 0],
      videoUrl: PLACEHOLDER_VIDEO,
    },
    {
      id: 'rooftop',
      title: 'Rooftop',
      description: 'Exclusive rooftop terrace with lounge areas and garden spaces.',
      position: [0, 5, 1],
      videoUrl: PLACEHOLDER_VIDEO,
    },
  ] as MarkerData[]
}
