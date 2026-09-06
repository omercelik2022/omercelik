// Adapted from shadcn/ui Button, MIT © 2023 shadcn.
// Full license: docs/references/shadcn-LICENSE.md. 21st.dev reference: docs/DESIGN.md.
import type {ComponentProps} from 'react';
import {Slot} from '@radix-ui/react-slot';
import {cva,type VariantProps} from 'class-variance-authority';
import {clsx} from 'clsx';
const buttonVariants=cva('button',{variants:{variant:{default:'button-primary',outline:'button-outline',ghost:'button-ghost',destructive:'button-danger'},size:{default:'',sm:'button-small',icon:'button-icon'}},defaultVariants:{variant:'default',size:'default'}});
export function Button({className,variant,size,asChild=false,type='button',...props}:ComponentProps<'button'>&VariantProps<typeof buttonVariants>&{asChild?:boolean}){const Comp=asChild?Slot:'button';return <Comp type={type} data-slot="button" className={clsx(buttonVariants({variant,size}),className)} {...props}/>;}
