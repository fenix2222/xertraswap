import get from "lodash/get";
import { DefaultTheme } from "styled-components";

const getThemeValue = (path: string, fallback?: string | number) => (theme: DefaultTheme): string =>
  get(theme, path, fallback) as string;

export default getThemeValue;
