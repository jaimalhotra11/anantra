export type VariantTypeInput = {
  _id: string
  handle: string
  imageVariant: boolean
  sortOrder: number
  options: {
    _id: string
    value: string
    label: string
    isActive?: boolean
  }[]
}

export type GeneratedVariant = {
  optionKey: string
  title: string
  selections: {
    variantTypeId: string
    optionId: string
    optionValue: string
    optionLabel: string
  }[]
}

export function toSlug(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

export function buildOptionKey(
  orderedHandlesAndOptionIds: { handle: string; optionId: string }[],
) {
  return orderedHandlesAndOptionIds.map((x) => `${x.handle}:${x.optionId}`).join('|')
}

export function generateVariantCombinations(variantTypes: VariantTypeInput[]) {
  const ordered = [...variantTypes].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  )

  const imageTypes = ordered.filter((t) => t.imageVariant)
  if (imageTypes.length > 1) {
    throw new Error(
      'Only one variant type can be imageVariant per product (e.g., Color).',
    )
  }

  const typesWithOptions = ordered.map((t) => ({
    ...t,
    options: (t.options || []).filter((o) => o.isActive !== false),
  }))

  if (typesWithOptions.length === 0) {
    return { imageVariantTypeHandle: imageTypes[0]?.handle, combinations: [] as GeneratedVariant[] }
  }

  let combos: Array<Array<{ vt: VariantTypeInput; opt: VariantTypeInput['options'][number] }>> = [
    [],
  ]

  for (const vt of typesWithOptions) {
    const next: typeof combos = []
    for (const base of combos) {
      for (const opt of vt.options) {
        next.push([...base, { vt, opt }])
      }
    }
    combos = next
  }

  const combinations: GeneratedVariant[] = combos.map((combo) => {
    const selections = combo.map(({ vt, opt }) => ({
      variantTypeId: vt._id,
      optionId: opt._id,
      optionValue: String(opt.value).toLowerCase(),
      optionLabel: String(opt.label),
    }))

    const optionKey = buildOptionKey(
      combo.map(({ vt, opt }) => ({ handle: vt.handle, optionId: opt._id })),
    )

    const title = combo.map(({ opt }) => String(opt.label)).join(' / ')

    return { optionKey, title, selections }
  })

  return {
    imageVariantTypeHandle: imageTypes[0]?.handle,
    combinations,
  }
}

