using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NHAGIAKIM.Data;

namespace NHAGIAKIM.Controllers
{
    public class BooksController : Controller
    {
        private readonly ApplicationDbContext _context;

        public BooksController(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> Index()
        {
            var books = await _context.Books
                .Where(b => b.IsActive)
                .ToListAsync();

            return View(books);
        }
    }
}