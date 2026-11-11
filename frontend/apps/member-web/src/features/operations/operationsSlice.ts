import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { operationalRegistry, type OperationalRow } from './operationalRegistry';

export interface OperationsState {
  rowsByScreen: Record<number, OperationalRow[]>;
  matrixByScreen: Record<number, string[]>;
  settingsByScreen: Record<number, Record<string, boolean>>;
}

export const initialOperationsState: OperationsState = {
  rowsByScreen: Object.fromEntries(Object.values(operationalRegistry).map(def => [def.id, def.rows])),
  matrixByScreen: Object.fromEntries(Object.values(operationalRegistry).filter(def => def.matrix).map(def => [def.id, def.matrix?.enabled ?? []])),
  settingsByScreen: Object.fromEntries(Object.values(operationalRegistry).filter(def => def.settings).map(def => [def.id, Object.fromEntries((def.settings ?? []).map(item => [item.key, item.enabled]))])),
};

const operationsSlice = createSlice({
  name: 'operations',
  initialState: initialOperationsState,
  reducers: {
    addOperationalRow(state, action: PayloadAction<{ screenId: number; row: OperationalRow }>) {
      const rows = state.rowsByScreen[action.payload.screenId] ?? (state.rowsByScreen[action.payload.screenId] = []);
      rows.unshift(action.payload.row);
    },
    updateOperationalStatus(state, action: PayloadAction<{ screenId: number; rowId: string; status: string; updated?: string }>) {
      const row = state.rowsByScreen[action.payload.screenId]?.find(item => item.id === action.payload.rowId);
      if (row) { row.status = action.payload.status; row.updated = action.payload.updated ?? 'Just now'; }
    },
    toggleOperationalMatrixCell(state, action: PayloadAction<{ screenId: number; key: string }>) {
      const cells = state.matrixByScreen[action.payload.screenId] ?? (state.matrixByScreen[action.payload.screenId] = []);
      const index = cells.indexOf(action.payload.key);
      if (index >= 0) cells.splice(index, 1); else cells.push(action.payload.key);
    },
    toggleOperationalSetting(state, action: PayloadAction<{ screenId: number; key: string }>) {
      const settings = state.settingsByScreen[action.payload.screenId] ?? (state.settingsByScreen[action.payload.screenId] = {});
      settings[action.payload.key] = !settings[action.payload.key];
    },
  },
});

export const { addOperationalRow, updateOperationalStatus, toggleOperationalMatrixCell, toggleOperationalSetting } = operationsSlice.actions;
export default operationsSlice.reducer;
