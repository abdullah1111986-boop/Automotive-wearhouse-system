
import { Item, Trainer, ItemStatus } from './types';

export const INITIAL_TRAINERS: Trainer[] = [
  { id: 't1', name: 'علي الشمري', password: '13950' },
  { id: 't2', name: 'رياض الغامدي', password: '6727' },
  { id: 't3', name: 'عبدالله الزهراني', password: '20582' },
  { id: 't4', name: 'خالد قدسي', password: '3839' },
  { id: 't5', name: 'سالم السفياني', password: '10596' },
  { id: 't6', name: 'احمد العصيمي', password: '18487' },
  { id: 't7', name: 'عبدالله غندورة', password: '20557' },
  { id: 't8', name: 'عمرو مؤذن', password: '18460' },
  { id: 't9', name: 'تركي الشمري', password: '10595' },
  { id: 't10', name: 'وليد السواط', password: '20463' },
  { id: 't11', name: 'عادل القثامي', password: '9079' },
  { id: 't12', name: 'احمد المالكي', password: '9232' },
  { id: 't13', name: 'عبدالله الغامدي', password: '6522' },
  { id: 't14', name: 'ايمن الانصاري', password: '20594' },
  { id: 't15', name: 'محمد الغامدي', password: '10591' },
];

export const INITIAL_ITEMS: Item[] = [
  { id: 'i1', name: 'جهاز فحص كمبيوتر (Scanner)', category: 'تشخيص', status: ItemStatus.AVAILABLE },
  { id: 'i2', name: 'طقم مفاتيح متري كامل', category: 'عدد يدوية', status: ItemStatus.AVAILABLE },
  { id: 'i3', name: 'رافعة هيدروليكية 3 طن', category: 'معدات رفع', status: ItemStatus.AVAILABLE },
  { id: 'i4', name: 'دريل هواء (Air Impact)', category: 'معدات هوائية', status: ItemStatus.AVAILABLE },
  { id: 'i5', name: 'جهاز قياس ضغط المحرك', category: 'قياس', status: ItemStatus.AVAILABLE },
  { id: 'i6', name: 'عربة عدة متحركة', category: 'تخزين', status: ItemStatus.AVAILABLE },
  { id: 'i7', name: 'مفك عزم (Torque Wrench)', category: 'عدد دقيقة', status: ItemStatus.AVAILABLE },
  { id: 'i8', name: 'جهاز شحن فريون', category: 'تكييف', status: ItemStatus.AVAILABLE },
  { id: 'i9', name: 'ملتيميتر رقمي', category: 'كهرباء', status: ItemStatus.AVAILABLE },
  { id: 'i10', name: 'زرادية كبس', category: 'عدد يدوية', status: ItemStatus.AVAILABLE },
];
