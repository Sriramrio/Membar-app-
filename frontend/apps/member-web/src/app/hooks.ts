import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './store';
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

/** Subscribe to the canonical network state while only re-rendering when the declared collections change.
 * This preserves existing selector/helper compatibility during the V7 backend migration without subscribing pages to unrelated network mutations.
 */
export function useNetworkSlice<K extends keyof RootState['network']>(keys: readonly K[]): RootState['network'] {
  return useAppSelector(
    state => state.network,
    (previous, next) => keys.every(key => previous[key] === next[key]),
  );
}
