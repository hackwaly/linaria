import { join } from 'path';

import { parseSync } from '@babel/core';
import generator from '@babel/generator';
import traverse from '@babel/traverse';
import dedent from 'dedent';

import { getTagProcessor } from '@linaria/babel-preset';
import type BaseProcessor from '@linaria/core/types/processors/BaseProcessor';

const run = (code: string): BaseProcessor | null => {
  const opts = { filename: join(__dirname, 'test.js'), code: true, ast: true };
  const state = {
    index: 0,
    file: { opts: { ...opts, root: '.' } },
  };
  const rootNode = parseSync(code, opts)!;
  let result: BaseProcessor | null = null;
  traverse(rootNode, {
    TaggedTemplateExpression(path) {
      result = getTagProcessor(path, state, {
        displayName: true,
      });
    },
  });

  return result;
};

function tagSource(processor: BaseProcessor | null): string | undefined {
  if (!processor) return undefined;
  // @ts-expect-error tagExpression is protected field
  return generator(processor.tagExpression).code;
}

describe('getTagProcessor', () => {
  it('should find correct import', () => {
    const result = run(
      dedent`
      import { css } from "@linaria/core";
      import { styled as renamedStyled, css as atomicCss } from "@linaria/atomic";

      const Cmp = () => null;

      export const Square = renamedStyled(Cmp)\`\`;
    `
    );

    expect(tagSource(result)).toBe('renamedStyled(Cmp)');
  });

  it('imported component', () => {
    const result = run(
      dedent`
      import Layout from "../__fixtures__/components-library";
      import { styled } from "@linaria/react";

      export const StyledLayout = styled(Layout)\`\`;
    `
    );

    expect(tagSource(result)).toBe('styled(Layout)');
  });

  it('renamedStyled(Cmp)``', () => {
    const result = run(
      dedent`
      import { styled as renamedStyled } from "@linaria/react";

      const Cmp = () => null;

      export const Square = renamedStyled(Cmp)\`\`;
    `
    );

    expect(tagSource(result)).toBe('renamedStyled(Cmp)');
  });

  it('(0, react_1.styled)(Cmp)``', () => {
    const result = run(
      dedent`
      const react_1 = require("@linaria/react");

      const Cmp = () => null;

      export const Square = (0, react_1.styled)(Cmp)\`\`;
    `
    );

    expect(tagSource(result)).toBe('react_1.styled(Cmp)');
  });

  it('styled(Cmp)``', () => {
    const result = run(
      dedent`
      import { styled } from "@linaria/react";

      const Cmp = () => null;

      export const Square = styled(Cmp)\`\`;
    `
    );

    expect(tagSource(result)).toBe('styled(Cmp)');
  });

  it('styled(hoc(Title))``', () => {
    const result = run(
      dedent`
      const { styled } = require('@linaria/react');

      const Title = styled.h1\`
        color: red;
      \`;

      const hoc = Cmp => Cmp;

      export const CustomTitle = styled(hoc(Title))\`
        font-size: 24px;
        color: blue;
      \`;
    `
    );

    expect(tagSource(result)).toBe('styled(hoc(Title))');
  });

  it('styled(() => { someLogic(); })``', () => {
    const result = run(
      dedent`
      const { styled } = require('@linaria/react');

      const someLogic = () => {};

      export const CustomTitle = styled(() => { someLogic(); })\`
        font-size: 24px;
        color: blue;
      \`;
    `
    );

    expect(tagSource(result)).toBe('styled(() => {})');
  });

  it('renamedStyled.div``', () => {
    const result = run(
      dedent`
      import { styled as renamedStyled } from "@linaria/react";

      export const Square = renamedStyled.div\`\`;
    `
    );

    expect(tagSource(result)).toBe("renamedStyled('div')");
  });

  it('(0, react_1.styled.div)``', () => {
    const result = run(
      dedent`
      const react_1 = require("@linaria/react");

      export const Square = (0, react_1.styled.div)\`\`;
    `
    );

    expect(tagSource(result)).toBe("react_1.styled('div')");
  });

  it('styled.div``', () => {
    const result = run(
      dedent`
      import { styled } from "@linaria/react";

      export const Square = styled.div\`\`;
    `
    );

    expect(tagSource(result)).toBe("styled('div')");
  });

  it('(0, core_1.css)``', () => {
    const result = run(
      dedent`
      const core_1 = require("@linaria/core");

      export const square = (0, core_1.css)\`\`;
    `
    );

    expect(tagSource(result)).toBe('core_1.css');
  });

  it('css``', () => {
    const result = run(
      dedent`
      import { css } from "@linaria/core";

      export const square = css\`\`;
    `
    );

    expect(tagSource(result)).toBe('css');
  });

  it('atomic css``', () => {
    const result = run(
      dedent`
      import { css } from "@linaria/atomic";

      export const square = css\`\`;
    `
    );

    expect(tagSource(result)).toBe('css');
  });

  it('re-imported css', () => {
    const result = run(
      dedent`
      import { css } from 'linaria';

      export const square = css\`\`;
    `
    );

    expect(tagSource(result)).toBe('css');
  });

  it('re-imported styled', () => {
    const result = run(
      dedent`
      import { styled } from 'linaria/react';

      export const Square = styled.div\`\`;
    `
    );

    expect(tagSource(result)).toBe("styled('div')");
  });

  it('import from unknown package', () => {
    const result = run(
      dedent`
      import { styled } from '@linaria/babel-preset';

      export const Square = styled.div\`\`;
    `
    );

    expect(result).toBeNull();
  });

  it('require and access with prop', () => {
    const result = run(
      dedent`
      const renamedStyled = require('@linaria/react').styled;
      export const Square = renamedStyled.div\`\`;
    `
    );

    expect(tagSource(result)).toBe("renamedStyled('div')");
  });

  it('require and destructing', () => {
    const result = run(
      dedent`
      const { styled } = require('@linaria/react');
      export const Square = styled.div\`\`;
    `
    );

    expect(tagSource(result)).toBe("styled('div')");
  });

  describe('invalid usage', () => {
    it('css.div``', () => {
      const runner = () =>
        run(
          dedent`import { css } from "@linaria/core"; export const square = css.div\`\`;`
        );

      expect(runner).toThrow('Invalid usage of `css` tag');
    });

    it('css("div")``', () => {
      const runner = () =>
        run(
          dedent`import { css } from "@linaria/core"; export const square = css("div")\`\`;`
        );

      expect(runner).toThrow('Invalid usage of `css` tag');
    });

    it('styled`` tag', () => {
      const runner = () =>
        run(
          dedent`import { styled } from "@linaria/react"; export const square = styled\`\`;`
        );

      expect(runner).toThrow('Invalid usage of `styled` tag');
    });

    it('styled.div.span`` tag', () => {
      const runner = () =>
        run(
          dedent`import { styled } from "@linaria/react"; export const square = styled.div.span\`\`;`
        );

      expect(runner).toThrow('Invalid usage of `styled` tag');
    });

    it('styled("div").span`` tag', () => {
      const runner = () =>
        run(
          dedent`import { styled } from "@linaria/react"; export const square = styled("div").span\`\`;`
        );

      expect(runner).toThrow('Invalid usage of `styled` tag');
    });
  });
});
