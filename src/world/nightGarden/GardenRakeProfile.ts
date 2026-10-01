/** Shared physical/analytical dimensions. World units are metres. */
// 25% denser traces with 28% less rise; the mesh and shader share this profile.
export const RAKE_FREQUENCIES = [31.25, 33.75, 30, 32.5] as const
export const PHYSICAL_RAKE_HEIGHT = 0.02736
export const RAKE_BURIAL = 0.006
export const RAKE_CROSS_SECTION = [-2.45, -1.65, -1.10, -0.55, 0, 0.55, 1.10, 1.65, 2.45] as const
export const RAKE_PROFILE_EDGE = 0.24
export const RAKE_PROFILE_POWER = 2.0
// Period average of the shaped profile, used to center its analytical relief.
export const RAKE_PROFILE_MEAN = 0.347898
