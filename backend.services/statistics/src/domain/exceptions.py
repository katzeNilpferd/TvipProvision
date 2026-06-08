class BaceStatisticsException(Exception):
    """Base exception for statistics-related errors."""


class StatisticsNotFoundException(BaceStatisticsException):
    """Exception raised when requested statistics data is not found."""
