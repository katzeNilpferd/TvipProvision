class DataBaseException(Exception):
    '''Base exception for database-related errors.'''


class NotConnectedException(DataBaseException):
    '''Exception raised when a database connection is not established.'''
