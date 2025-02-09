// useMeta.ts
import { reactive, watch, onMounted } from 'vue';

export interface Meta {
  title?: string;
  description?: string;
  keywords?: string;
  // Add more meta properties as needed.
}

/**
 * A composable for managing document meta tags.
 * @param initialMeta - An object containing initial meta values.
 * @returns A reactive meta object.
 */
export function useMeta(initialMeta: Meta = {}): Meta {
  // Create a reactive meta object with defaults.
  const meta = reactive<Meta>({
    title: initialMeta.title || '',
    description: initialMeta.description || '',
    keywords: initialMeta.keywords || '',
  });

  // Function to update the document's meta tags.
  const updateMeta = (): void => {
    // Update document title if provided.
    if (meta.title) {
      document.title = meta.title;
    }

    // Update or create the meta description tag.
    let descriptionTag: HTMLMetaElement | null = document.querySelector('meta[name="description"]');
    if (!descriptionTag) {
      descriptionTag = document.createElement('meta');
      descriptionTag.setAttribute('name', 'description');
      document.head.appendChild(descriptionTag);
    }
    descriptionTag.setAttribute('content', meta.description || '');

    // Update or create the meta keywords tag.
    let keywordsTag: HTMLMetaElement | null = document.querySelector('meta[name="keywords"]');
    if (!keywordsTag) {
      keywordsTag = document.createElement('meta');
      keywordsTag.setAttribute('name', 'keywords');
      document.head.appendChild(keywordsTag);
    }
    keywordsTag.setAttribute('content', meta.keywords || '');
  };

  // Watch the reactive meta object for changes and update the meta tags.
  watch(meta, updateMeta, { deep: true, immediate: true });

  // Ensure meta is updated when the component mounts.
  onMounted(updateMeta);

  return meta;
}
