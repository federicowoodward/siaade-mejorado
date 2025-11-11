import {
  trigger,
  state,
  style,
  transition,
  animate,
  AnimationTriggerMetadata,
} from '@angular/animations';

export const expandCollapse: AnimationTriggerMetadata = trigger(
  'expandCollapse',
  [
    state('open', style({ height: '*', opacity: 1 })),
    state('closed', style({ height: '0px', opacity: 0 })),
    transition('open <=> closed', animate('300ms ease-in-out')),
  ]
);
