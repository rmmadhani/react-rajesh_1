import React from 'react';
import ReactDOM from 'react-dom';
import seedrandom from 'seedrandom';
import App from './App';
import { BP2D } from 'binpackingjs';

const { Bin, Box, Packer, heuristics } = BP2D;

const getRandom = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
};

const getRandomColor = (seed) => {
  let rng = seedrandom(seed);
  return '#' + rng().toString(16).slice(2, 8).toUpperCase();
};

const Paper = ({ width, height, children }) => {
  return (
    <svg width={width} height={height}>
      {children}
    </svg>
  );
};
const Rect = (props = {}) => {
  return <rect {...props} />;
};

const UIBinAdd = ({ defaultWidth, defaultHeight, onAdd, onChange }) => {
  let w = defaultWidth,
    h = defaultHeight;
  return (
    <div>
      <UIBin width={w} height={h} onChange={onChange} />
      <button onClick={() => onAdd(w, h)}>Add</button>
    </div>
  );
};

const UIBin = ({ width, height, onChange }) => {
  return (
    <span>
      Width{' '}
      <input
        type="number"
        value={width}
        onChange={(e) => onChange(Number(e.target.value), height)}
        required
        style={inputStyles}
      />{' '}
      x Height{' '}
      <input
        type="number"
        value={height}
        onChange={(e) => onChange(width, Number(e.target.value))}
        required
        style={inputStyles}
      />
    </span>
  );
};

const styles = {
  fontFamily: 'sans-serif',
  textAlign: 'center',
};

const inputStyles = {
  width: 55,
};

const UIBoxAdd = ({
  defaultWidth,
  defaultHeight,
  onAdd,
  onChange,
  bins = [],
}) => {
  let w = defaultWidth,
    h = defaultHeight,
    b = 0;
  return (
    <div>
      <UIBin width={w} height={h} onChange={onChange} />
      <select value={b} onChange={(evt) => (b = evt.target.value)}>
        {bins.map((bin, index) => (
          <option value={index}>Bin {index + 1}</option>
        ))}
      </select>
      <button onClick={() => onAdd(w, h, b)}>Add</button>
    </div>
  );
};

class App extends React.Component {
  unpackedBoxes = [];

  constructor(props) {
    super(props);
    this.state = {
      heuristic: 'BestShortSideFit',
      paper: { width: 300, height: 300 },
      defaultBin: { width: 200, height: 200 },
      defaultBox: { width: 100, height: 100 },
      bins: [[200, 200]],
      boxes: [
        [100, 100],
        [40, 70],
      ],
    };
  }

  getBins() {
    return this.state.bins.map(([width, height], index) => {
      return (
        <div>
          <strong>Bin {index + 1}</strong>
          <UIBin
            key={'bin-' + index}
            width={width}
            height={height}
            onChange={(w, h) => {
              this.state.bins[index] = [w, h];
              this.setState({ bins: this.state.bins });
            }}
          />
          <button
            onClick={() =>
              this.state.bins.splice(index, 1) &&
              this.setState({ bins: this.state.bins })
            }
          >
            -
          </button>
        </div>
      );
    });
  }

  getBoxes() {
    return this.state.boxes.map(([width, height], index) => {
      return (
        <div>
          <strong>Box {index + 1}</strong>
          <UIBin
            key={'box-' + index}
            width={width}
            height={height}
            onChange={(nW, nH) => {
              this.state.boxes[index] = [nW, nH];
              this.setState({ boxes: this.state.boxes });
            }}
          />
          <button
            onClick={() =>
              this.state.boxes.splice(index, 1) &&
              this.setState({ boxes: this.state.boxes })
            }
          ></button>
        </div>
      );
    });
  }

  visualize() {
    let { bins, boxes, heuristic, paper } = this.state;
    let algo, paperPacker, packer, boxesOfBins;

    // buggg
    if (heuristics[heuristic]) {
      algo = new heuristics[heuristic]();
    }

    // pack bins to paper
    boxesOfBins = bins.map((b) => new Box(b[0], b[1]));

    paperPacker = new Packer([new Bin(paper.width, paper.height)]);
    paperPacker.pack(boxesOfBins);

    // pack boxes to bins
    packer = new Packer(bins.map((b) => new Bin(b[0], b[1], algo)));
    packer.pack(boxes.map((b) => new Box(b[0], b[1])));

    this.unpackedBoxes = packer.unpackedBoxes;

    return packer.bins.map((bin, binId) => {
      let out = [
        <Rect
          width={bin.width}
          height={bin.height}
          x={boxesOfBins[binId].x}
          y={boxesOfBins[binId].y}
          style={{ stroke: '#000', strokeWidth: 1, fill: '#fff' }}
        />,
      ];

      if (bin.boxes.length > 0) {
        out = out.concat(
          bin.boxes.map((box, boxId) => {
            console.log(getRandomColor(`${binId}-${boxId}`));
            return (
              <Rect
                width={box.width}
                height={box.height}
                x={box.x}
                y={box.y}
                transform={`translate(${boxesOfBins[binId].x} ${boxesOfBins[binId].y})`}
                style={{ fill: getRandomColor(`${binId}-${boxId}`) }}
              />
            );
          })
        );
      }

      return out;
    });
  }

  render() {
    return (
      <div style={{ display: 'flex' }}>
        <div>
          <Paper
            width={this.state.paper.width}
            height={this.state.paper.height}
          >
            {this.visualize()}
          </Paper>
          <hr />
          <textarea
            readOnly
            value={JSON.stringify({
              bins: this.state.bins,
              boxes: this.state.boxes,
            })}
          />
        </div>

        <div>
          <h3>Heuristics</h3>
          <select
            value={this.state.heuristic}
            onChange={(event) =>
              this.setState({ heuristic: event.target.value })
            }
          >
            <option value="BestAreaFit">BestAreaFit</option>
            <option value="BestLongSideFit">BestLongSideFit</option>
            <option value="BestShortSideFit">BestShortSideFit</option>
            <option value="BottomLeft">BottomLeft</option>
          </select>

          <h3>Bins ({this.state.bins.length})</h3>

          {
            <UIBinAdd
              defaultWidth={this.state.defaultBin.width}
              defaultHeight={this.state.defaultBin.height}
              onAdd={(w, h) => {
                let { bins } = this.state;
                bins.push([w, h]);
                this.setState({ bins });
              }}
              onChange={(w, h) => {
                this.state.defaultBin.width = w;
                this.state.defaultBin.height = h;
                this.setState({ defaultBin: this.state.defaultBin });
              }}
            />
          }

          {this.getBins()}

          <br />

          <h3>Boxes ({this.state.boxes.length})</h3>

          <UIBoxAdd
            defaultWidth={getRandom(1, 30)}
            defaultHeight={getRandom(1, 30)}
            bins={this.state.bins}
            onAdd={(w, h, b) => {
              let { boxes } = this.state;
              boxes.push([w, h, b]);
              this.setState({ boxes });
            }}
          />

          {this.getBoxes()}
        </div>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));

ReactDOM.render(getRandom(10, 100), document.getElementById('r1'));
ReactDOM.render(getRandomColor(12345), document.getElementById('r2'));

/* const title = React.createElement('h1', {}, 'My First React Code');
const paragraph = React.createElement(
  'p',
  {},
  'Writing some more HTML. Cool stuff!'
);
const container = React.createElement('div', {}, [title, paragraph]);

ReactDOM.render(container, document.getElementById('root'));

const list = React.createElement(
  'div',
  {},
  React.createElement('h1', {}, 'My favorite ice cream flavors'),
  React.createElement('ul', {}, [
    React.createElement('li', {}, 'Chocolate'),
    React.createElement('li', {}, 'Vanilla'),
    React.createElement('li', {}, 'Banana'),
  ])
);

ReactDOM.render(list, document.getElementById('r4')); */

/* document.write('Testing  :      getRandom(min,max) function : \n');

document.write('<br>');
document.write(getRandom(1, 100));
document.write('<br>');
document.write('----------------------------------');

document.write('<br>');
document.write('Testing  :      getRandom(min,max) function : <br> ');
document.write('color is  : ');
document.write(getRandomColor(666666));
document.write('<br>');
document.write('----------------------------------');
 */
