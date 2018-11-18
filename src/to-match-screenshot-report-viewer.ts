import { TestResult, AsssertionResult, ErrorMessageObject } from './to-match-screenshot-reporter-types';

async function main( testResults: TestResult[] ) {
  const container = document.createDocumentFragment();
  await Promise.all( testResults.map( async testResult => {
    const node = await renderTestResult( testResult );
    container.appendChild( wrapWithTitle( 'h2', testResult.testFilePath, node ) );
  } ) );
  document.body.appendChild(container);
}

async function renderTestResult( testResult: TestResult ) {
  const container = document.createElement('div');

  await Promise.all( testResult.assertionResults.map( async assertionResult => {
    const node = await renderAssertionResult( assertionResult );
    container.appendChild( wrapWithTitle( 'h3', assertionResult.fullName, node ) );
  } ) );
  return container;
}

async function renderAssertionResult( assertionResult: AsssertionResult ): Promise<HTMLDivElement> {
  const errorMessageObject = assertionResult.errorMessageObject as ErrorMessageObject;

  const [ expectedUrl, actualUrl ] = [ `${errorMessageObject.expected}.png`, `${errorMessageObject.actual}.png` ];
  const [ expected, actual ] = await Promise.all( [ expectedUrl, actualUrl ].map( url => loadImage(url) ) );

  const [ expectedCanvas, actualCanvas ] = [ expected, actual ].map( image => {
    return createCanvasFromImage( image );
  } );

  const [ expectedImageData, actualImageData ] = [ expectedCanvas, actualCanvas ].map( canvas => {
    const context = canvas.getContext('2d') as CanvasRenderingContext2D;
    return context.getImageData(0, 0, expectedCanvas.width, expectedCanvas.height);
  })

  const diff = document.createElement('canvas');
  const diffContext = diff.getContext('2d') as CanvasRenderingContext2D;

  const diffImageData = diffContext.createImageData(expectedCanvas.width, expectedCanvas.height);
  // @ts-ignore
  pixelmatch( expectedImageData.data as Uint8Array, actualImageData.data as Uint8Array, diffImageData.data as Uint8Array, expected.width, expected.height, {threshold: 0 });
  diffContext.putImageData(diffImageData, 0, 0);

  const container = document.createElement('div');
  container.appendChild( wrapWithTitle( 'h4', 'Expected', expected ));
  container.appendChild( wrapWithTitle( 'h4', 'Actual', actual ));
  container.appendChild( wrapWithTitle( 'h4', 'Diff', diff ));

  return container;
}

function wrapWithTitle( heading: string, title: string, element: HTMLElement): HTMLElement {
  const container = document.createElement('div');
  const titleElement = document.createElement(heading);
  titleElement.textContent = title;
  container.appendChild(titleElement);
  container.appendChild(element);
  return container;
}

async function loadImage( url: string ): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>( resolve => {
      const image = new Image();
      image.src = url;

      const fn = () => {
        resolve(image);
        image.removeEventListener('load', fn);
      };

      image.addEventListener('load', fn);
  } );
}

function createCanvasFromImage( image: HTMLImageElement ) {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;

  const context = canvas.getContext('2d') as CanvasRenderingContext2D;
  context.drawImage( image, 0, 0 );

  return canvas;
}
