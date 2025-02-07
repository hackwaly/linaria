import type { SourceLocation } from '@babel/types';

import type {
  IInterpolation,
  Rules,
  ValueCache,
} from '@linaria/core/processors/types';
import { debug } from '@linaria/logger';
import type { IProps } from '@linaria/react/processors/styled';
import StyledProcessor, { hasMeta } from '@linaria/react/processors/styled';
import { slugify } from '@linaria/utils';

import atomize from './helpers/atomize';

export default class AtomicStyledProcessor extends StyledProcessor {
  public override extractRules(
    valueCache: ValueCache,
    cssText: string,
    loc?: SourceLocation | null
  ): [Rules, string] {
    const rules: Rules = {};

    const wrappedValue =
      typeof this.component === 'string'
        ? null
        : valueCache.get(this.component.node);

    const atomicRules = atomize(cssText, hasMeta(wrappedValue));
    atomicRules.forEach((rule) => {
      // eslint-disable-next-line no-param-reassign
      rules[rule.cssText] = {
        cssText: rule.cssText,
        start: loc?.start ?? null,
        className: this.className,
        displayName: this.displayName,
        atom: true,
      };

      debug(
        'evaluator:template-processor:extracted-atomic-rule',
        `\n${rule.cssText}`
      );
    });

    const classes = atomicRules
      // Some atomic rules produced (eg. keyframes) don't have class names, and they also don't need to appear in the object
      .filter((rule) => !!rule.className)
      .map((rule) => rule.className!)
      .join(' ');

    return [rules, classes];
  }

  protected override getProps(
    classes: string,
    uniqInterpolations: IInterpolation[]
  ): IProps {
    const props = super.getProps(classes, uniqInterpolations);
    props.class = [classes, this.className].filter(Boolean).join(' ');
    props.atomic = true;
    return props;
  }

  // eslint-disable-next-line class-methods-use-this
  protected override getVariableId(value: string): string {
    // id is based on the slugified value
    return slugify(value);
  }
}
