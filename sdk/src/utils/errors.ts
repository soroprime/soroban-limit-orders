export class SdkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SdkError';
  }
}

export class ValidationError extends SdkError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends SdkError {
  constructor(message: string, public readonly statusCode?: number) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ContractError extends SdkError {
  constructor(message: string, public readonly code?: number) {
    super(message);
    this.name = 'ContractError';
  }
}