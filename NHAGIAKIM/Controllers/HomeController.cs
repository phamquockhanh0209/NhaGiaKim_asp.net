using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NHAGIAKIM.Data;

namespace NHAGIAKIM.Controllers
{
    public class HomeController : Controller
    {
        private readonly ApplicationDbContext _context;

        public HomeController(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> Index()
        {
            var book = await _context.Books
                .Where(b => b.IsActive)
                .FirstOrDefaultAsync();

            return View(book);
        }
    }
}