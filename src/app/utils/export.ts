import { ObservationLibre, Cible, CommentaireGeneral } from '../types';

/* ── GeoJSON export ── */
export function exportGeoJSON(
  cibles: Cible[],
  observations: ObservationLibre[],
  commentaires: CommentaireGeneral[]
) {
  const features = [
    ...cibles.map((c) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [c.longitude, c.latitude] },
      properties: {
        type: 'cible',
        id: c.cible_id,
        titre: c.titre_affichage,
        sous_titre: c.sous_titre_affichage,
        faisceau: c.faisceau_nom,
        score: c.score_indice_calcule,
        classe: c.classe_indice_calcule,
        theme: c.theme_principal,
        question_cle: c.question_cle,
      },
    })),
    ...observations.map((o) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [o.longitude, o.latitude] },
      properties: {
        type: 'observation',
        id: o.id,
        categorie: o.categorie,
        type_autre: o.type_autre,
        classes_concernees: o.classes_concernees,
        commentaire: o.commentaire,
        auteur: o.auteur,
        organisation: o.organisation,
        date: o.date,
        heure: o.heure,
        cible_id: o.cible_id,
        faisceau_id: o.faisceau_id,
        segment_id: o.segment_id,
        segment_label: o.segment_label,
        segment_score_calcule: o.segment_score_calcule,
        indice_juge: o.indice_juge,
        upvotes: o.upvotes,
        downvotes: o.downvotes,
        score_net: o.upvotes - o.downvotes,
        nb_photos: o.photos?.length ?? 0,
        nb_commentaires: o.commentaires?.length ?? 0,
      },
    })),
  ];

  const geojson = {
    type: 'FeatureCollection',
    name: 'cyclabilite_grand_geneve',
    generated: new Date().toISOString(),
    metadata: {
      total_cibles: cibles.length,
      total_observations: observations.length,
      total_commentaires: commentaires.length,
    },
    features,
  };

  download(JSON.stringify(geojson, null, 2), 'cyclabilite_grand_geneve.geojson', 'application/geo+json');
}

/* ── CSV export (observations only) ── */
export function exportCSV(observations: ObservationLibre[]) {
  const headers = [
    'id', 'latitude', 'longitude', 'categorie', 'commentaire',
    'type_autre', 'classes_concernees', 'auteur', 'organisation', 'date', 'heure', 'cible_id',
    'faisceau_id', 'segment_id', 'segment_label', 'segment_score_calcule',
    'indice_juge', 'upvotes', 'downvotes', 'score_net',
    'nb_photos', 'nb_commentaires',
  ];

  const rows = observations.map((o) => [
    o.id,
    o.latitude,
    o.longitude,
    o.categorie,
    `"${(o.commentaire || '').replace(/"/g, '""')}"`,
    `"${(o.type_autre || '').replace(/"/g, '""')}"`,
    `"${(o.classes_concernees || []).join(' | ').replace(/"/g, '""')}"`,
    `"${(o.auteur || '').replace(/"/g, '""')}"`,
    `"${(o.organisation || '').replace(/"/g, '""')}"`,
    o.date,
    o.heure || '',
    o.cible_id || '',
    o.faisceau_id || '',
    o.segment_id || '',
    `"${(o.segment_label || '').replace(/"/g, '""')}"`,
    o.segment_score_calcule ?? '',
    o.indice_juge || '',
    o.upvotes,
    o.downvotes,
    o.upvotes - o.downvotes,
    o.photos?.length ?? 0,
    o.commentaires?.length ?? 0,
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  download(csv, 'observations_cyclabilite.csv', 'text/csv');
}

/* ── Download helper ── */
function download(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
