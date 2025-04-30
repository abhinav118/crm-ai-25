
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export const useSortableEmailSection = (id: string) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return {
    sortableProps: {
      ref: setNodeRef,
      style: {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 9999 : 1,
      },
      ...attributes,
      ...listeners,
    },
    isDragging,
  };
};
