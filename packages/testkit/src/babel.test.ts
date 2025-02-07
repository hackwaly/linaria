import { join } from 'path';

import type { TransformOptions } from '@babel/core';
import { transformAsync } from '@babel/core';
import dedent from 'dedent';
import stripAnsi from 'strip-ansi';

import type { StrictOptions } from '@linaria/babel-preset';

import serializer from './__utils__/linaria-snapshot-serializer';

expect.addSnapshotSerializer(serializer);

const baseDir = join(__dirname, '..');

const transpile = async (
  input: string,
  opts: Partial<StrictOptions> = {
    evaluate: false,
  },
  isTS = false
) => {
  const presets: TransformOptions['presets'] = [
    [require.resolve('@linaria/babel-preset'), opts],
  ];

  if (isTS) {
    presets.unshift(require.resolve('@babel/preset-typescript'));
  }

  return (await transformAsync(input, {
    babelrc: false,
    presets,
    plugins: ['@babel/plugin-syntax-jsx'],
    filename: join(baseDir, '__tests__', 'app', `index.${isTS ? 'ts' : 'js'}`),
    configFile: false,
  }))!;
};

it('transpiles styled template literal with object', async () => {
  const { code, metadata } = await transpile(
    dedent`
    import { styled } from '@linaria/react';

    export const Title = styled.h1\`
      font-size: 14px;
    \`;
    `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('uses string passed in as classNameSlug', async () => {
  const { code, metadata } = await transpile(
    dedent`
    import { styled } from '@linaria/react';

    export const Title = styled('h1')\`
      font-size: 14px;
    \`;
`,
    {
      classNameSlug: ['hash', 'title', 'file', 'name', 'ext', 'dir']
        .map((s) => `[${s}]`)
        .join('_'),
    }
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('removes fake replacement patterns in string classNameSlug', async () => {
  const { code, metadata } = await transpile(
    dedent`
    import { styled } from '@linaria/react';

    export const Title = styled('h1')\`
      font-size: 14px;
    \`;
`,
    {
      classNameSlug: '[not]_[actual]_[replacements]',
    }
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('handles fn passed in as classNameSlug', async () => {
  const { code, metadata } = await transpile(
    dedent`
    import { styled } from '@linaria/react';

    export const Title = styled('h1')\`
      font-size: 14px;
    \`;
`,
    {
      classNameSlug: (hash, title, vars) => {
        return [
          hash,
          title,
          vars.hash,
          vars.title,
          vars.file,
          vars.name,
          vars.ext,
          vars.dir,
        ].join('_');
      },
    }
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('transpiles styled template literal with function and tag', async () => {
  const { code, metadata } = await transpile(
    dedent`
    import { styled } from '@linaria/react';

    export const Title = styled('h1')\`
      font-size: 14px;
    \`;
    `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('transpiles renamed styled import', async () => {
  const { code, metadata } = await transpile(
    dedent`
    import { styled as custom } from '@linaria/react';

    export const Title = custom('h1')\`
      font-size: 14px;
    \`;
    `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('transpiles renamed css and atomic-css imports in the same file', async () => {
  const { code, metadata } = await transpile(
    dedent`
    /* @flow */

    import { css as coreCss } from '@linaria/core';
    import { css as atomicCss } from '@linaria/atomic';

    const x = coreCss\`
      background: red;
    \`;

    const y = atomicCss\`
      background: red;
    \`;

    console.log(x, y);
      `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('transpiles renamed styled and atomic-styled imports in the same file', async () => {
  const { code, metadata } = await transpile(
    dedent`
    /* @flow */

    import { styled as reactStyled } from '@linaria/react';
    import { styled as atomicStyled } from '@linaria/atomic';

    const StyledComponent = reactStyled.div\`
      background: red;
    \`;
    const StyledComponent2 = reactStyled(StyledComponent)\`
      background: blue;
    \`;

    const AtomicComponent = atomicStyled.div\`
      background: red;
    \`;
    const AtomicComponent2 = atomicStyled(AtomicComponent)\`
      background: blue;
    \`;

    console.log(StyledComponent, StyledComponent2, AtomicComponent, AtomicComponent2);
      `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('transpiles renamed css from linaria v2', async () => {
  const { code, metadata } = await transpile(
    dedent`
    import {css as coreCss} from 'linaria';

    const x = coreCss\`
      background: red;
    \`;

    console.log(x);
      `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('transpiles styled template literal with function and component', async () => {
  const { code, metadata } = await transpile(
    dedent`
    import { styled } from '@linaria/react';
    const Heading = () => null;

    export const Title = styled(Heading)\`
      font-size: 14px;
    \`;
    `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('transpiles styled template literal with TS component', async () => {
  const { code, metadata } = await transpile(
    dedent`
    import { styled } from '@linaria/react';

    type Props = { className?: string; children?: React.ReactNode };

    export const Title = styled((props: Props) => null)\`
      font-size: 14px;
    \`;
    `,
    {
      evaluate: false,
    },
    true
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('transpiles with typed fn as interpolated value', async () => {
  const { code, metadata } = await transpile(
    dedent`
    import { styled } from '@linaria/react';

    type Props = { className?: string; children?: React.ReactNode };

    export const Title = styled.div\`
      font-size: 14px;
      content: "${'${(props: Props) => props.className}'}"
    \`;
    `,
    {
      evaluate: false,
    },
    true
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('outputs valid CSS classname', async () => {
  const { code, metadata } = await transpile(
    dedent`
    import { styled } from '@linaria/react';

    export const ΩPage$Title = styled.h1\`
      font-size: 14px;
    \`;
    `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('evaluates and inlines expressions in scope', async () => {
  const { code, metadata } = await transpile(
    dedent`
    import { styled } from '@linaria/react';

    const color = 'blue';

    export const Title = styled.h1\`
      color: ${'${color}'};
      width: ${'${100 / 3}'}%;
    \`;
    `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('inlines object styles as CSS string', async () => {
  const { code, metadata } = await transpile(
    dedent`
    import { styled } from '@linaria/react';

    const cover = {
      '--color-primaryText': '#222',
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      opacity: 1,
      minHeight: 420,

      '&.shouldNotBeChanged': {
        borderColor: '#fff',
      },

      '@media (min-width: 200px)': {
        WebkitOpacity: .8,
        MozOpacity: .8,
        msOpacity: .8,
        OOpacity: .8,
        WebkitBorderRadius: 2,
        MozBorderRadius: 2,
        msBorderRadius: 2,
        OBorderRadius: 2,
        WebkitTransition: '400ms',
        MozTransition: '400ms',
        OTransition: '400ms',
        msTransition: '400ms',
      }
    };

    export const Title = styled.h1\`
      ${'${cover}'}
    \`;
    `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('inlines array styles as CSS string', async () => {
  const { code, metadata } = await transpile(
    dedent`
    import { styled } from '@linaria/react';

    const styles = [
      { flex: 1 },
      { display: 'block', height: 24 },
    ];

    export const Title = styled.h1\`
      ${'${styles}'}
    \`;
    `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('replaces unknown expressions with CSS custom properties', async () => {
  const { code, metadata } = await transpile(
    dedent`
    import { styled } from '@linaria/react';

    export const Title = styled.h1\`
      font-size: ${'${size}'}px;
      color: ${'${props => props.color}'};
    \`;
    `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('handles interpolation followed by unit', async () => {
  const { code, metadata } = await transpile(
    dedent`
    import { styled } from '@linaria/react';

    export const Title = styled.h1\`
      font-size: ${'${size}'}em;
      text-shadow: black 1px ${'${shadow}'}px, white -2px -2px;
      margin: ${'${size}'}px;
      width: calc(2 * ${'${props => props.width}'}vw);
      height: ${'${props => { if (true) { return props.height } else { return 200 } }}'}px;
      grid-template-columns: ${'${unit}'}fr 1fr 1fr ${'${unit}'}fr;
      border-radius: ${'${function(props) { return 200 }}'}px
    \`;
    `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('uses the same custom property for the same identifier', async () => {
  const { code, metadata } = await transpile(
    dedent`
    import { styled } from '@linaria/react';

    export const Box = styled.div\`
      height: ${'${size}'}px;
      width: ${'${size}'}px;
    \`;
    `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('uses the same custom property for the same expression', async () => {
  const { code, metadata } = await transpile(
    dedent`
    import { styled } from '@linaria/react';

    export const Box = styled.div\`
      height: ${'${props => props.size}'}px;
      width: ${'${props => props.size}'}px;
    \`;
    `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('handles nested blocks', async () => {
  const { code, metadata } = await transpile(
    dedent`
    import { styled } from '@linaria/react';

    export const Button = styled.button\`
      font-family: ${'${regular}'};

      &:hover {
        border-color: blue;
      }

      @media (max-width: 200px) {
        width: 100%;
      }
    \`;
    `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('prevents class name collision', async () => {
  const { code, metadata } = await transpile(
    dedent`
    import { styled } from '@linaria/react';

    export const Title = styled.h1\`
      font-size: ${'${size}'}px;
      color: ${'${props => props.color}'}
    \`;

    function Something() {
      const Title = styled.h1\`
        font-family: ${'${regular}'};
      \`;

      return <Title />;
    }
    `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('does not output CSS if none present', async () => {
  const { code, metadata } = await transpile(
    dedent`
      const number = 42;

      const title = String.raw\`This is something\`;
      `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('does not output CSS property when value is a blank string', async () => {
  const { code, metadata } = await transpile(
    dedent`
    import { css } from '@linaria/core';

    export const title = css\`
      font-size: ${''};
      margin: 6px;
    \`;
    `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('transpiles css template literal', async () => {
  const { code, metadata } = await transpile(
    dedent`
    import { css } from '@linaria/core';

    export const title = css\`
      font-size: 14px;
    \`;
    `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('handles css template literal in object property', async () => {
  const { code, metadata } = await transpile(
    dedent`
    import { css } from '@linaria/core';

    const components = {
      title: css\`
        font-size: 14px;
      \`
    };
    `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('handles css template literal in JSX element', async () => {
  const { code, metadata } = await transpile(
    dedent`
    import { css } from '@linaria/core';

    <Title class={css\` font-size: 14px; \`} />
    `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('throws when contains dynamic expression without evaluate: true in css tag', async () => {
  expect.assertions(1);

  try {
    await transpile(
      dedent`
      import { css } from '@linaria/core';

      const title = css\`
        font-size: ${'${size}'}px;
      \`;
      `
    );
  } catch (e) {
    expect(
      stripAnsi(
        (e as { message: string }).message.replace(baseDir, '<<DIRNAME>>')
      )
    ).toMatchSnapshot();
  }
});

it('supports both css and styled tags', async () => {
  const { code, metadata } = await transpile(
    dedent`
      import { css } from '@linaria/core';
      import { styled } from '@linaria/react';

      export const Title = styled.h1\`
        font-size: 14px;
      \`;

      export const title = css\`
        color: blue;
      \`;
      `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('does not include styles if not referenced anywhere', async () => {
  const { code, metadata } = await transpile(
    dedent`
      import { css } from '@linaria/core';
      import { styled } from '@linaria/react';

      const Title = styled.h1\`
        font-size: 14px;
      \`;

      const title = css\`
        color: blue;
      \`;
      `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('includes unreferenced styles for :global', async () => {
  const { code, metadata } = await transpile(
    dedent`
      import { css } from '@linaria/core';
      import { styled } from '@linaria/react';

      const a = css\`
        :global() {
          .title {
            font-size: 14px;
          }
        }
      \`;

      const B = styled.div\`
        :global(.title) {
          font-size: 14px;
        }
      \`;
      `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('handles objects with numeric keys', async () => {
  const { code, metadata } = await transpile(
    dedent`
      import { css } from '@linaria/core';

      export const object = {
        stringKey: css\`\`,
        42: css\`\`,
      }
      `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('handles objects with enums as keys', async () => {
  const { code, metadata } = await transpile(
    dedent`
      import { css } from '@linaria/core';
      import { TestEnum } from './ts-data.ts';

      export const object = {
        [TestEnum.FirstValue]: css\`\`,
        [TestEnum.SecondValue]: css\`\`,
      }
      `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('compiles atomic css', async () => {
  const { code, metadata } = await transpile(
    dedent`
    /* @flow */

    import { css } from '@linaria/atomic';
    import { styled } from '@linaria/react';

    const x = css\`
      background: red;
      height: 100px;
    \`;

    console.log(x);

      `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('compiles atomic css with property priorities', async () => {
  const { code, metadata } = await transpile(
    dedent`
    /* @flow */

    import { css } from '@linaria/atomic';
    import { styled } from '@linaria/react';

    const y = css\`
      margin-left: 5px;
    \`;

    const x = css\`
      margin: 0;
    \`;

    console.log(x, y);

      `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('compiles atomic css with at-rules and pseudo classes', async () => {
  const { code, metadata } = await transpile(
    dedent`
    /* @flow */

    import { css } from '@linaria/atomic';
    import { styled } from '@linaria/react';

    const x = css\`
      @media (max-width: 500px) {
        background: blue;
      }
      @media (min-width: 300px) {
        &:hover {
          background: purple;
        }
      }
      &:enabled {
        width: 100%;
      }
      background: red;
      height: 100px;
    \`;

    console.log(x);

      `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('compiles atomic css with at-rules and property priorities', async () => {
  const { code, metadata } = await transpile(
    dedent`
    /* @flow */

    import { css } from '@linaria/atomic';
    import { styled } from '@linaria/react';

    const x = css\`
      @media (max-width: 500px) {
        padding: 0;
      }
      @media (min-width: 300px) {
        &:hover {
          padding-top: 5px;
        }
      }
      &:enabled {
        padding-left: 6px;
      }
      padding-bottom: 7px;
    \`;

    console.log(x);
      `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('compiles atomic css with keyframes', async () => {
  const { code, metadata } = await transpile(
    dedent`
    /* @flow */

    import { css } from '@linaria/atomic';
    import { styled } from '@linaria/react';

    const x = css\`
      @keyframes fade {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      animation: fade 1s infinite;

      background: red;
      height: 100px;
    \`;

    console.log(x);

      `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('compiles atomic styled with static css', async () => {
  const { code, metadata } = await transpile(
    dedent`
    /* @flow */

    import { styled } from '@linaria/atomic';

    const Component = styled.div\`
      color: blue;
      height: 100px;
    \`;

    console.log(Component);

      `
  );
  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('compiles atomic css with unique atoms based on key value pairs', async () => {
  const { code, metadata } = await transpile(
    dedent`
    /* @flow */
    import { css } from '@linaria/atomic';
    const x = css\`
      height: 100px;
    \`;
    const y = css\`
      height: 99px
    \`;
    console.log(x, y);
      `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('compiles atomic styled with plain css, static and dynamic interpolations', async () => {
  const { code, metadata } = await transpile(
    dedent`
    /* @flow */

    import { styled } from '@linaria/atomic';

    const Component = styled.div\`
      color: blue;
      height: 100px;
      margin: ${'${100 / 2}'}px;
      background-color: ${'${props => props.color}'};
    \`;

    console.log(Component);

      `
  );
  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('compiles atoms that are shared between css and styled templates', async () => {
  const { code, metadata } = await transpile(
    dedent`
    /* @flow */

    import { css } from '@linaria/atomic';
    import { styled } from '@linaria/atomic';

    const x = css\`
      background: red;
      height: 100px;
    \`

    const Component = styled.div\`
      background: red;
      height: ${'${200 / 2}'}px;
      margin: 10px;
      color: ${'${props => props.color}'};
    \`;

    console.log(x, Component);

      `
  );
  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('compiles atomic styled wrapping other components with extra priority', async () => {
  const { code, metadata } = await transpile(
    dedent`
    /* @flow */

    import { styled } from '@linaria/atomic';

    const Component = styled.div\`
      background-color: blue;
      height: 100px;
    \`;

    const ComponentCompositing = styled(Component)\`
      background: red;
      height: 105px;
    \`;

    console.log(ComponentCompositing);

      `
  );
  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('compiles atomic styled without colliding by property', async () => {
  const { code, metadata } = await transpile(
    dedent`
    /* @flow */

    import { styled } from '@linaria/atomic';

    export const Component = styled.ul\`
      display: flex;
      padding: 0;
    \`;

    export const Component2 = styled.ul\`
      display: block;
      padding: 0;
    \`;

      `
  );
  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('compiles atomic styled with dynamic interpolations as unique variables based on the interpolation text', async () => {
  const { code, metadata } = await transpile(
    dedent`
    /* @flow */

    import { styled } from '@linaria/atomic';

    const Component = styled.div\`
      color: ${'${props => props.color}'};
      border-color: ${'${props => props.color}'};
      background-color: ${'${props => props.backgroundColor}'};
    \`;

    const Component2 = styled.div\`
      color: ${'${props => props.color}'};
      border-color: ${'${props => props.color || "black"}'};
    \`;

    console.log(Component, Component2);

      `
  );
  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});
