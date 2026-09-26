import type { SVGProps } from "react";
import { NoMark } from "./no-logo";

export { NoMark };

/**
 * Backward compatibility alias for the new NO brand mark.
 */
export function ForgeMark(props: SVGProps<SVGSVGElement>) {
  return <NoMark {...props} />;
}
