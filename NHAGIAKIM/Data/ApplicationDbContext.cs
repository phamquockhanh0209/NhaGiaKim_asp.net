using Microsoft.EntityFrameworkCore;
using NHAGIAKIM.Models;

namespace NHAGIAKIM.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(
            DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Book> Books { get; set; }
    }
}