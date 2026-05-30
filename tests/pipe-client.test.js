const net = require('net');
jest.mock('net');

const pipeClient = require('../src/main/pipe-client');

let mockSocket;

beforeEach(() => {
  jest.clearAllMocks();
  pipeClient._resetActive();
  mockSocket = {
    write: jest.fn(),
    on: jest.fn(),
    end: jest.fn(),
    destroy: jest.fn(),
  };
  net.createConnection.mockReturnValue(mockSocket);
});

test('sends REMEDIATE command on connect', () => {
  pipeClient.remediate(5000, () => {}, () => {});
  const connectCb = mockSocket.on.mock.calls.find(([ev]) => ev === 'connect')?.[1];
  connectCb?.();
  expect(mockSocket.write).toHaveBeenCalledWith(
    expect.stringContaining('"cmd":"REMEDIATE"')
  );
  expect(mockSocket.write).toHaveBeenCalledWith(
    expect.stringContaining('"walSizeBefore":5000')
  );
});

test('calls onProgress for each progress event', () => {
  const onProgress = jest.fn();
  pipeClient.remediate(0, onProgress, () => {});
  const dataCb = mockSocket.on.mock.calls.find(([ev]) => ev === 'data')?.[1];
  dataCb?.(Buffer.from(JSON.stringify({ status: 'stopping_service' }) + '\n'));
  expect(onProgress).toHaveBeenCalledWith({ status: 'stopping_service' });
});

test('calls onComplete and closes socket on done', () => {
  const onComplete = jest.fn();
  pipeClient.remediate(0, () => {}, onComplete);
  const dataCb = mockSocket.on.mock.calls.find(([ev]) => ev === 'data')?.[1];
  dataCb?.(Buffer.from(JSON.stringify({ status: 'done', walGone: true }) + '\n'));
  expect(onComplete).toHaveBeenCalledWith({ status: 'done', walGone: true });
  expect(mockSocket.end).toHaveBeenCalled();
});

test('calls onComplete and closes socket on error', () => {
  const onComplete = jest.fn();
  pipeClient.remediate(0, () => {}, onComplete);
  const dataCb = mockSocket.on.mock.calls.find(([ev]) => ev === 'data')?.[1];
  dataCb?.(Buffer.from(JSON.stringify({ status: 'error', message: 'fail' }) + '\n'));
  expect(onComplete).toHaveBeenCalledWith({ status: 'error', message: 'fail' });
  expect(mockSocket.end).toHaveBeenCalled();
});

test('ignores concurrent remediate calls while one is active', () => {
  const onComplete1 = jest.fn();
  const onComplete2 = jest.fn();
  pipeClient.remediate(0, () => {}, onComplete1);
  pipeClient.remediate(0, () => {}, onComplete2);
  expect(net.createConnection).toHaveBeenCalledTimes(1);
});
