class AuthException(Exception):
    '''Base exception for authentication-related errors.'''


class UserNotFoundException(AuthException):
    '''Exception raised when a user is not found.'''


class UserAlreadyExistsException(AuthException):
    '''Exception raised when attempting to create a user that already exists.'''
    

class InvalidPasswordException(AuthException):
    '''Exception raised when a password is invalid.'''


class InactiveUserException(AuthException):
    '''Exception raised when a user account is inactive.'''


class InvalidTokenException(AuthException):
    '''Exception raised when an authentication token is invalid.'''


class ExpiredTokenException(AuthException):
    '''Exception raised when an authentication token has expired.'''


class UnauthorizedException(AuthException):
    '''Exception raised for unauthorized access attempts.'''
