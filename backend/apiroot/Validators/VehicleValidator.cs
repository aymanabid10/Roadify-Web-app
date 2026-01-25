using System.ComponentModel.DataAnnotations;

namespace apiroot.Validators;

public static class VehicleValidator
{
    public static List<string> ValidateVehicle(int year, string registrationNumber, string vehicleType, string status, decimal? mileage)
    {
        var errors = new List<string>();

        // Validate year
        var currentYear = DateTime.UtcNow.Year;
        if (year < 1900 || year > currentYear + 1)
        {
            errors.Add($"Year must be between 1900 and {currentYear + 1}");
        }

        // Validate registration number format
        if (!string.IsNullOrWhiteSpace(registrationNumber))
        {
            if (registrationNumber.Length < 3 || registrationNumber.Length > 50)
            {
                errors.Add("Registration number must be between 3 and 50 characters");
            }
        }

        // Validate vehicle type
        var validTypes = new[] { "Car", "Truck", "Van", "Motorcycle", "Bus", "Other" };
        if (!string.IsNullOrWhiteSpace(vehicleType) && !validTypes.Contains(vehicleType))
        {
            errors.Add($"Vehicle type must be one of: {string.Join(", ", validTypes)}");
        }

        // Validate status
        var validStatuses = new[] { "Available", "InUse", "Maintenance", "Retired" };
        if (!string.IsNullOrWhiteSpace(status) && !validStatuses.Contains(status))
        {
            errors.Add($"Status must be one of: {string.Join(", ", validStatuses)}");
        }

        // Validate mileage
        if (mileage.HasValue && mileage.Value < 0)
        {
            errors.Add("Mileage cannot be negative");
        }

        if (mileage.HasValue && mileage.Value > 10000000)
        {
            errors.Add("Mileage seems unrealistic (maximum 10,000,000 km)");
        }

        return errors;
    }

    public static bool IsValidVehicleType(string vehicleType)
    {
        var validTypes = new[] { "Car", "Truck", "Van", "Motorcycle", "Bus", "Other" };
        return validTypes.Contains(vehicleType);
    }

    public static bool IsValidStatus(string status)
    {
        var validStatuses = new[] { "Available", "InUse", "Maintenance", "Retired" };
        return validStatuses.Contains(status);
    }

    public static string[] GetValidVehicleTypes()
    {
        return new[] { "Car", "Truck", "Van", "Motorcycle", "Bus", "Other" };
    }

    public static string[] GetValidStatuses()
    {
        return new[] { "Available", "InUse", "Maintenance", "Retired" };
    }
}
