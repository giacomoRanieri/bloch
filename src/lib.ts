import { makeBloch, QuantumStateChangeCallback } from './bloch';
import { calculateOriantation, Matrix2x2 } from './eigen';
import { GateSelector, SelectedGate } from './gateselector';
import { SelectedState, StateSelector } from './stateselector';
import { MatrixInput } from './matrixinput';
import { QuantumStateInput } from './quantumstateinput';
import { min, pi } from 'mathjs';

// calculate mouse position in normalized device coordinates
// (-1 to +1) for both components
function toNormalizedCoordinates(canvas: HTMLCanvasElement, event: MouseEvent): [number, number] {
  const rect = canvas.getBoundingClientRect();
  return [
    ((event.clientX - rect.left) / canvas.width) * 2 - 1,
    -(((event.clientY - rect.top) / canvas.height) * 2 - 1),
  ];
}

function initCanvas(canvas: HTMLCanvasElement, quantumStateChanged: QuantumStateChangeCallback) {
  let previousMousePosition = { x: 0, y: 0 };
  const bloch = makeBloch(canvas, quantumStateChanged);
  bloch.setQuantumStateVector(3.14 / 4, 3.14 / 2);

  function onPointerDown(event: MouseEvent) {
    previousMousePosition = { x: event.pageX, y: event.pageY };
    bloch.onMouseDown(...toNormalizedCoordinates(canvas, event));
  }

  function onPointerUp(event: MouseEvent) {
    bloch.onMouseUp(...toNormalizedCoordinates(canvas, event));
  }

  function onPointerMove(event: MouseEvent) {
    let deltaMove = {
      x: event.pageX - previousMousePosition.x,
      y: event.pageY - previousMousePosition.y,
    };

    bloch.onMouseMove(...toNormalizedCoordinates(canvas, event), deltaMove.x, deltaMove.y);

    previousMousePosition = { x: event.pageX, y: event.pageY };
  }

  function render(time: number) {
    bloch.render();
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);

  // TODO: cleanup
  canvas.addEventListener('pointerdown', onPointerDown, false);
  window.addEventListener('pointerup', onPointerUp, false);
  window.addEventListener('pointermove', onPointerMove, false);

  return bloch;
}

export function init(
  stateContainer: HTMLElement,
  matrixContainer: HTMLElement,
  canvasContainer: HTMLElement,
  buttonContainer: HTMLElement
) {
  function createSaveImageButton(getDataURLCallback: () => string) {
    const container = document.createElement('div');

    const button = document.createElement('button');
    button.textContent = 'Save image';
    container.appendChild(button);

    const link = document.createElement('a');
    container.appendChild(link);

    // TODO: clenaup
    button.addEventListener('click', () => {
      link.setAttribute('download', 'bloch.png');
      link.setAttribute('href', getDataURLCallback());
      link.click();
    });

    return container;
  }

  function createViewButtons() {
    const container = document.createElement('div');

    const buttoni = document.createElement('button');
    buttoni.textContent = 'i';
    container.appendChild(buttoni);

    const buttonp = document.createElement('button');
    buttonp.textContent = '+';
    container.appendChild(buttonp);

    const button0 = document.createElement('button');
    button0.textContent = '0';
    container.appendChild(button0);

    button0.addEventListener('click', () => {
      // bloch.setRotation(0, 0, 0); // (top: i right: + front: 0)
      // bloch.setRotation(0, 0, pi / 2); // (top: + right: -i front: 0)
      // bloch.setRotation(0, 0, pi); // (top: -i right: - front: 0)

      // bloch.setRotation(0, pi / 2, 0, true); // (top: 0 right: i front: +)
      // bloch.setRotation(0, 0, (3 * pi) / 2); // (top: i right: + front: 0)
      bloch.setRotation(0, 0, -pi / 2); // (top: - right: i front: 0)
      // bloch.setRotation(-pi / 2, 0, -pi / 2); // (top: 0 right: i front: +)
      // bloch.setRotation(-pi / 2, 0, -pi); // (top: 0 right: - front: i)
    });

    buttoni.addEventListener('click', () => {
      bloch.setRotation(-pi / 2, 0, -pi); // (top: 0 right: - front: i)
    });

    buttonp.addEventListener('click', () => {
      bloch.setRotation(-pi / 2, 0, -pi / 2); // (top: 0 right: i front: +)
    });

    return container;
  }

  function createCanvas() {
    const element = document.createElement('canvas');
    element.width = 500;
    element.height = 500;
    element.style.setProperty('touch-action', 'none');
    return element;
  }

  const quantumStateInput = new QuantumStateInput(
    stateContainer,
    (theta: number, phi: number) => bloch.setQuantumStateVector(theta, phi),
    () => qubitGateOpFormula()
  );

  new StateSelector(stateContainer, (option: string) => {
    const optionToPhiAndTheta: any = {
      [SelectedState.state0]: { theta: 0, phi: 0 },
      [SelectedState.state1]: { theta: pi, phi: 0 },
      [SelectedState.statePlus]: { theta: pi / 2, phi: 0 },
      [SelectedState.stateMinus]: { theta: pi / 2, phi: pi },
      [SelectedState.stateI]: { theta: pi / 2, phi: pi / 2 },
      [SelectedState.stateMinusI]: { theta: pi / 2, phi: (3 * pi) / 2 },
    };

    const { theta, phi } = optionToPhiAndTheta[option];
    quantumStateInput.update(theta, phi);
    bloch.setQuantumStateVector(theta, phi);
    qubitGateOpFormula();
  });

  const matrixInput = new MatrixInput(matrixContainer, (matrix: Matrix2x2) =>
    setMatrixOnBloch(matrix)
  );
  new GateSelector(matrixContainer, (option: string) => {
    const optionToMatrix: {
      [key: string]: [string, [string, string], [string, string]];
    } = {
      [SelectedGate.X]: ['', ['0', '1'], ['1', '0']],
      [SelectedGate.Y]: ['', ['0', '-i'], ['i', '0']],
      [SelectedGate.Z]: ['', ['1', '0'], ['0', '-1']],
      [SelectedGate.H]: ['sqrt(1/2)', ['1', '1'], ['1', '-1']],
      [SelectedGate.Clear]: ['', ['', ''], ['', '']],
    };
    matrixInput.setMatrix(optionToMatrix[option]);
    setMatrixOnBloch(matrixInput.getMatrix());
    // TODO: trigger Gate * qubit multiplication
    qubitGateOpFormula();
  });

  const setMatrixOnBloch = (matrix: Matrix2x2 | null) => {
    if (matrix === null) {
      bloch.hideRotationAxis();
      return;
    }

    const orientation = calculateOriantation(matrix);
    bloch.setRotationAxis(orientation.x, orientation.y, orientation.z, orientation.rotationAngle);
  };

  function qubitGateOpFormula() {
    // matrixInput.getMatrix();
    const state = quantumStateInput.getStateVec();
    matrixInput.qubitGateOpFormula(state);
  }

  buttonContainer.appendChild(
    createSaveImageButton(
      () => canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream') // here is the most important part because if you dont replace you will get a DOM 18 exception.
    )
  );
  buttonContainer.appendChild(createViewButtons());

  let canvas: HTMLCanvasElement = createCanvas();
  canvasContainer.appendChild(canvas);
  const bloch = initCanvas(canvas, (theta, phi) => quantumStateInput.update(theta, phi));

  return {
    resizeCanvas(size: number) {
      canvas.height = size;
      canvas.width = size;
      bloch.adaptToResizedCanvas();
    },
  };
}
