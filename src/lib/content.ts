import artifactsJson from "@/content/artifacts.json";
import dialogueJson from "@/content/dialogue.json";
import activitiesJson from "@/content/activities.json";
import type { ArtifactContent, ArtifactId, DialogueLine } from "@/store/types";

export const ARTIFACTS = artifactsJson as unknown as Record<ArtifactId, ArtifactContent>;
const DIALOGUE = dialogueJson as unknown as Record<string, DialogueLine[]>;

export const getArtifact = (id: ArtifactId) => ARTIFACTS[id];
export const getDialogue = (key: string): DialogueLine[] => DIALOGUE[key] ?? [];

export interface RockData {
  id: string;
  name: string;
  look: string;
  scan: string;
  water: boolean;
  color: string;
}
export interface Experiment {
  id: string;
  label: string;
  icon: string;
  action: string;
  result: string;
}
export interface QuizOption {
  id: string;
  text: string;
  correct: boolean;
  feedback: string;
}

export const ACTIVITIES = activitiesJson as unknown as {
  soilLab: { title: string; intro: string; experiments: Experiment[]; question: string; options: QuizOption[] };
  rockScanner: { title: string; intro: string; required: number; rocks: RockData[]; wrongHint: string; success: string };
  digSite: {
    title: string;
    intro: string;
    cols: number;
    rows: number;
    iceCells: number[];
    foundText: string;
    waitButton: string;
    waitAction: string;
    revealText: string;
    minDug: number;
  };
};
