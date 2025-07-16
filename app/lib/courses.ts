export type CourseLevel = 'L1' | 'L2' | 'L3' | 'CRFPA';

export interface Course {
  id: string;
  name: string;
  level: CourseLevel;
  pdfPath?: string;
}

export const COURSES: Course[] = [
  // L1 Courses
  {
    id: 'l1-droit-public',
    name: 'Introduction au droit public et droit constitutionnel',
    level: 'L1',
  },
  {
    id: 'l1-droit-prive',
    name: 'Introduction au droit privé et droit civil des personnes et de la famille',
    level: 'L1',
  },
  {
    id: 'l1-histoire-droit',
    name: 'Introduction historique au Droit et Histoire des institutions',
    level: 'L1',
  },
  {
    id: 'l1-science-politique',
    name: 'Introduction à la science politique et économie politique',
    level: 'L1',
  },
  {
    id: 'l1-droit-administratif',
    name: 'Droit administratif et institutions administratives',
    level: 'L1',
  },
  {
    id: 'l1-institutions-europeennes',
    name: 'Institutions européennes et système juridique de l\'Union européenne',
    level: 'L1',
  },
  {
    id: 'l1-relations-internationales',
    name: 'Relations et institutions internationales',
    level: 'L1',
  },
  {
    id: 'l1-organisations-juridictionnelles',
    name: 'Organisations juridictionnelles et règles du procès',
    level: 'L1',
  },
  
  // L2 Courses
  {
    id: 'l2-droit-obligations',
    name: 'Droit des obligations',
    level: 'L2',
  },
  {
    id: 'l2-droit-administratif',
    name: 'Droit administratif et institutions administratives',
    level: 'L2',
  },
  {
    id: 'l2-droit-fiscal',
    name: 'Droit fiscal et finances publiques',
    level: 'L2',
  },
  {
    id: 'l2-droit-penal',
    name: 'Droit pénal et procédure pénale',
    level: 'L2',
  },
  {
    id: 'l2-systemes-juridiques',
    name: 'Systèmes juridiques comparés et culture juridique contemporaine',
    level: 'L2',
  },
  {
    id: 'l2-droit-affaires',
    name: 'Droit des affaires',
    level: 'L2',
  },
  
  // L3 Courses
  {
    id: 'l3-contrats-speciaux',
    name: 'Contrats spéciaux',
    level: 'L3',
  },
  {
    id: 'l3-droit-biens',
    name: 'Droit des biens',
    level: 'L3',
  },
  {
    id: 'l3-droit-travail',
    name: 'Droit du travail et relations collectives',
    level: 'L3',
  },
  {
    id: 'l3-droit-affaires',
    name: 'Droit des affaires',
    level: 'L3',
  },
  {
    id: 'l3-procedure-civile',
    name: 'Procédure civile',
    level: 'L3',
  },
  {
    id: 'l3-tglf',
    name: 'TGLF',
    level: 'L3',
  },
  {
    id: 'l3-institutions-europeennes',
    name: 'Institutions européennes et système juridique de l\'Union européenne',
    level: 'L3',
  },
  
  // CRFPA Courses
  {
    id: 'crfpa-droit-obligations',
    name: 'Droit des obligations CRFPA',
    level: 'CRFPA',
  },
  {
    id: 'crfpa-note-synthese',
    name: 'Note de synthèse',
    level: 'CRFPA',
  },
  {
    id: 'crfpa-penal',
    name: 'Pénal et procédure pénale',
    level: 'CRFPA',
  },
  {
    id: 'crfpa-droit-civil',
    name: 'Droit civil CRFPA',
    level: 'CRFPA',
  },
  {
    id: 'crfpa-droit-public',
    name: 'Droit public et contentieux administratif',
    level: 'CRFPA',
  },
  {
    id: 'crfpa-droit-international',
    name: 'Droit international et européen',
    level: 'CRFPA',
  },
  {
    id: 'crfpa-droit-affaires',
    name: 'Droit des affaires',
    level: 'CRFPA',
  },
  {
    id: 'crfpa-procedure-civile',
    name: 'Procédure civile',
    level: 'CRFPA',
  },
  {
    id: 'crfpa-droit-fiscal',
    name: 'Droit fiscal et finances publiques',
    level: 'CRFPA',
  },
  {
    id: 'crfpa-tglf',
    name: 'TGLF (Oral)',
    level: 'CRFPA',
  },
];

export function getCoursesByLevel(level: CourseLevel): Course[] {
  return COURSES.filter(course => course.level === level);
}

export function findCourseById(id: string): Course | undefined {
  return COURSES.find(course => course.id === id);
}

export function findCourseByName(name: string, level?: CourseLevel): Course | undefined {
  const normalizedName = name.toLowerCase().trim();
  return COURSES.find(course => {
    const courseNameMatch = course.name.toLowerCase().includes(normalizedName);
    const levelMatch = level ? course.level === level : true;
    return courseNameMatch && levelMatch;
  });
}