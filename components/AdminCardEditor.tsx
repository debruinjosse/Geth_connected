"use client";

import { useState } from "react";
import { updateCardContentAction } from "@/app/actions/adminControls";
import { Button } from "@/components/ui/Button";
import { Field, FieldGrid, Input, Select, Textarea } from "@/components/ui/Fields";
import { Modal } from "@/components/ui/Modal";

type Labels = {
  edit: string;
  name: string;
  category: string;
  caption: string;
  sentence: string;
  slugLocked: string;
  save: string;
};

export function AdminCardEditor({
  card,
  categories,
  labels
}: {
  card: { id: string; title: string; category: string; description: string; recognition_sentence: string };
  categories: { value: string; label: string }[];
  labels: Labels;
}) {
  const [open, setOpen] = useState(false);
  const id = `card-${card.id}`;

  return (
    <>
      <Button variant="ghost" size="sm" type="button" onClick={() => setOpen(true)}>
        {labels.edit}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={card.title} wide>
        <form action={updateCardContentAction}>
          <input type="hidden" name="cardId" value={card.id} />
          <FieldGrid>
            <Field label={labels.name} htmlFor={`${id}-title`}>
              <Input id={`${id}-title`} name="title" defaultValue={card.title} required />
            </Field>
            <Field label={labels.category} htmlFor={`${id}-category`}>
              <Select id={`${id}-category`} name="category" defaultValue={card.category} required>
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={labels.caption} htmlFor={`${id}-description`} className="lp-span-2">
              <Textarea id={`${id}-description`} name="description" rows={3} defaultValue={card.description} required />
            </Field>
            <Field label={labels.sentence} htmlFor={`${id}-sentence`} className="lp-span-2">
              <Textarea id={`${id}-sentence`} name="recognitionSentence" rows={3} defaultValue={card.recognition_sentence} required />
            </Field>
          </FieldGrid>
          <div className="lp-form-foot">
            <small className="lp-hint">{labels.slugLocked}</small>
            <Button type="submit">{labels.save}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
