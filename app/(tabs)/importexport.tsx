import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import {
  cacheDirectory,
  readAsStringAsync,
  writeAsStringAsync,
} from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { randomUUID } from 'expo-crypto';
import { parseExcelImport, buildExportWorkbook, buildImportTemplate, filterNewContacts, filterNewTemplates } from '../../lib/excel';
import { createContact, listContacts } from '../../db/contacts';
import { createTemplate, listTemplates } from '../../db/chargeTemplates';
import { listAllLinesForExport } from '../../db/charges';
import { LABELS } from '../../constants/labels';
import type { ContactRow, TemplateRow } from '../../lib/excel';

// ── Import ─────────────────────────────────────────────────────────────────

type ImportPreview = {
  contacts: ContactRow[];
  templates: TemplateRow[];
  errors: string[];
};

function useImport() {
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [loading, setLoading] = useState(false);

  async function pickFile() {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
      ],
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    setLoading(true);
    try {
      const base64 = await readAsStringAsync(result.assets[0].uri, {
        encoding: 'base64',
      });
      const parsed = parseExcelImport(base64);
      setPreview(parsed);
    } catch {
      Alert.alert('Error', 'No se pudo leer el archivo. Verificá que sea un Excel válido.');
    } finally {
      setLoading(false);
    }
  }

  function commit() {
    if (!preview) return;

    const newContacts = filterNewContacts(preview.contacts, listContacts());
    const newTemplates = filterNewTemplates(preview.templates, listTemplates(true));

    for (const row of newContacts) {
      createContact({ id: randomUUID(), ...row });
    }
    for (const row of newTemplates) {
      createTemplate({ id: randomUUID(), ...row });
    }

    const contactsAdded = newContacts.length;
    const templatesAdded = newTemplates.length;

    setPreview(null);
    Alert.alert(
      'Importación completa',
      `${contactsAdded} contacto(s) y ${templatesAdded} plantilla(s) agregadas.`,
    );
  }

  return { preview, loading, pickFile, commit, cancel: () => setPreview(null) };
}

// ── File save helpers ──────────────────────────────────────────────────────

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

async function saveFile(fileName: string, base64: string, dialogTitle: string) {
  const path = `${cacheDirectory}${fileName}`;
  await writeAsStringAsync(path, base64, { encoding: 'base64' });
  await Sharing.shareAsync(path, { mimeType: XLSX_MIME, dialogTitle });
}

// ── Export ─────────────────────────────────────────────────────────────────

async function runDownloadTemplate() {
  await saveFile('plantilla-importacion.xlsx', buildImportTemplate(), 'Plantilla de importación');
}

async function runExport() {
  const rows = listAllLinesForExport();
  if (rows.length === 0) {
    Alert.alert('Sin datos', 'No hay cobros registrados para exportar.');
    return;
  }
  const date = new Date().toISOString().slice(0, 10);
  await saveFile(`historial-${date}.xlsx`, buildExportWorkbook(rows), `Historial de pagos ${date}`);
}

// ── Screen ─────────────────────────────────────────────────────────────────

export default function ImportExportScreen() {
  const { preview, loading, pickFile, commit, cancel } = useImport();
  const [exporting, setExporting] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  async function handleDownloadTemplate() {
    setDownloadingTemplate(true);
    try {
      await runDownloadTemplate();
    } catch {
      Alert.alert('Error', 'No se pudo generar la plantilla.');
    } finally {
      setDownloadingTemplate(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      await runExport();
    } catch {
      Alert.alert('Error', 'No se pudo generar el archivo de exportación.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="px-4 pb-3">
        <Text className="text-xl font-bold text-gray-900 dark:text-gray-100">{LABELS.importExport.screenTitle}</Text>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="px-4 pt-2 pb-24 gap-4">

        {/* Import */}
        <View className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 gap-3">
          <Text className="text-base font-semibold text-gray-900 dark:text-gray-100">{LABELS.importExport.importTitle}</Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400">{LABELS.importExport.importHint}</Text>

          {loading ? (
            <ActivityIndicator className="py-4" />
          ) : preview ? (
            <PreviewPanel preview={preview} onCommit={commit} onCancel={cancel} />
          ) : (
            <Pressable
              onPress={pickFile}
              className="bg-blue-600 rounded-xl py-3 items-center active:opacity-70"
            >
              <Text className="text-white font-semibold text-sm">{LABELS.importExport.pickFileButton}</Text>
            </Pressable>
          )}
        </View>

        {/* Download template */}
        <View className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 gap-3">
          <Text className="text-base font-semibold text-gray-900 dark:text-gray-100">{LABELS.importExport.templateTitle}</Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400">{LABELS.importExport.templateHint}</Text>
          <Pressable
            onPress={handleDownloadTemplate}
            disabled={downloadingTemplate}
            className="bg-gray-700 rounded-xl py-3 items-center active:opacity-70 disabled:opacity-50"
          >
            {downloadingTemplate ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-sm">{LABELS.importExport.templateButton}</Text>
            )}
          </Pressable>
        </View>

        {/* Export */}
        <View className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 gap-3">
          <Text className="text-base font-semibold text-gray-900 dark:text-gray-100">{LABELS.importExport.exportTitle}</Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400">{LABELS.importExport.exportHint}</Text>

          <Pressable
            onPress={handleExport}
            disabled={exporting}
            className="bg-green-600 rounded-xl py-3 items-center active:opacity-70 disabled:opacity-50"
          >
            {exporting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-sm">{LABELS.importExport.exportButton}</Text>
            )}
          </Pressable>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Preview panel ──────────────────────────────────────────────────────────

function PreviewPanel({
  preview,
  onCommit,
  onCancel,
}: {
  preview: ImportPreview;
  onCommit: () => void;
  onCancel: () => void;
}) {
  const hasData = preview.contacts.length > 0 || preview.templates.length > 0;

  return (
    <View className="gap-3">
      {/* Summary counts */}
      <View className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 gap-1">
        <Text className="text-sm text-gray-700 dark:text-gray-300">
          <Text className="font-semibold">{preview.contacts.length}</Text> contacto(s) encontrado(s)
        </Text>
        <Text className="text-sm text-gray-700 dark:text-gray-300">
          <Text className="font-semibold">{preview.templates.length}</Text> plantilla(s) encontrada(s)
        </Text>
      </View>

      {/* Errors */}
      {preview.errors.length > 0 && (
        <View className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3 gap-1">
          <Text className="text-sm font-semibold text-yellow-800 dark:text-yellow-400">{LABELS.importExport.warningsTitle}</Text>
          {preview.errors.map((e, i) => (
            <Text key={i} className="text-xs text-yellow-700 dark:text-yellow-500">• {e}</Text>
          ))}
        </View>
      )}

      {/* Contacts preview */}
      {preview.contacts.length > 0 && (
        <View className="gap-1">
          <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{LABELS.importExport.previewContacts}</Text>
          {preview.contacts.slice(0, 5).map((c, i) => (
            <Text key={i} className="text-sm text-gray-700 dark:text-gray-300">• {c.name}{c.phone ? ` — ${c.phone}` : ''}</Text>
          ))}
          {preview.contacts.length > 5 && (
            <Text className="text-xs text-gray-400 dark:text-gray-500">… y {preview.contacts.length - 5} más</Text>
          )}
        </View>
      )}

      {/* Templates preview */}
      {preview.templates.length > 0 && (
        <View className="gap-1">
          <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{LABELS.importExport.previewTemplates}</Text>
          {preview.templates.slice(0, 5).map((t, i) => (
            <Text key={i} className="text-sm text-gray-700 dark:text-gray-300">• {t.concept} — ₡{t.amount.toLocaleString('es-CR')}</Text>
          ))}
          {preview.templates.length > 5 && (
            <Text className="text-xs text-gray-400 dark:text-gray-500">… y {preview.templates.length - 5} más</Text>
          )}
        </View>
      )}

      {/* Action buttons */}
      <View className="flex-row gap-2 pt-1">
        <Pressable
          onPress={onCancel}
          className="flex-1 border border-gray-200 dark:border-gray-600 rounded-xl py-3 items-center active:opacity-70"
        >
          <Text className="text-gray-600 dark:text-gray-300 font-semibold text-sm">{LABELS.common.cancel}</Text>
        </Pressable>
        {hasData && (
          <Pressable
            onPress={onCommit}
            className="flex-1 bg-blue-600 rounded-xl py-3 items-center active:opacity-70"
          >
            <Text className="text-white font-semibold text-sm">{LABELS.importExport.importButton}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
