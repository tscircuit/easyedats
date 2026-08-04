export interface EasyEdaReferenceSpec {
  filename: string
  kind: "pcb" | "schematic-list"
  sha256: string
  source: string
  url: string
}

export const easyEdaReferences: readonly EasyEdaReferenceSpec[] = [
  {
    filename: "simplefocmini-2024-04-26-schematic.json",
    kind: "schematic-list",
    sha256: "3f623e6cc998907604f1aa51ef3b95e9c03617fc1359433b49700195d4589a2e",
    source:
      "simplefoc/SimpleFOCMini@8e10d4ba398624bd0ef970e82c03d7a6bcc2220d (MIT)",
    url: "https://raw.githubusercontent.com/simplefoc/SimpleFOCMini/8e10d4ba398624bd0ef970e82c03d7a6bcc2220d/EasyEDA/SCH_simplefocmini_2024-04-26.json",
  },
  {
    filename: "simplefocmini-2024-04-26-pcb.json",
    kind: "pcb",
    sha256: "076fe4689e26eee9612736799a6506dfbcf68ac4e3fe55fc20993af882ca2f8b",
    source:
      "simplefoc/SimpleFOCMini@8e10d4ba398624bd0ef970e82c03d7a6bcc2220d (MIT)",
    url: "https://raw.githubusercontent.com/simplefoc/SimpleFOCMini/8e10d4ba398624bd0ef970e82c03d7a6bcc2220d/EasyEDA/PCB_simplefocmini_2024-04-26.json",
  },
  {
    filename: "open-core0-v2-pcb.json",
    kind: "pcb",
    sha256: "9cf89dd2e31ba9e95c5d6eae3d2fa52bb0dee3e8fdc71fb15c3e77df7532667c",
    source:
      "OpenStickCommunity/Hardware@3b61a1bfe8dacc6df09d17030d7a35a02a8d437a (Open_Core0 v2.0 by TheTrain, CC BY 4.0)",
    url: "https://raw.githubusercontent.com/OpenStickCommunity/Hardware/3b61a1bfe8dacc6df09d17030d7a35a02a8d437a/Boards/GP2040-CE%20Official%20Controllers/Open_Core0/Source%20files/PCB%20-%20Open_Core0%20v2.0.json",
  },
]
