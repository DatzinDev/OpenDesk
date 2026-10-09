import { FileInput } from "@mantine/core";
import { IconPaperclip } from "@tabler/icons-react";
import { ACCEPT, MAX_FILES, MAX_SIZE } from "../types";

type Props = { value: File[]; onChange: (files: File[]) => void };

export function FilesField({ value, onChange }: Props) {
  const tooBig = value.find((f) => f.size > MAX_SIZE);
  return (
    <FileInput
      label="Adjuntos"
      description={`Imágenes o PDF, hasta ${MAX_FILES} archivos de 10 MB.`}
      placeholder="Seleccionar archivos"
      leftSection={<IconPaperclip size={16} />}
      multiple
      clearable
      accept={ACCEPT}
      value={value}
      onChange={onChange}
      error={
        value.length > MAX_FILES
          ? `Puedes adjuntar hasta ${MAX_FILES} archivos.`
          : tooBig && `${tooBig.name} supera los 10 MB.`
      }
    />
  );
}

export const filesOk = (files: File[]) => files.length <= MAX_FILES && files.every((f) => f.size <= MAX_SIZE);
