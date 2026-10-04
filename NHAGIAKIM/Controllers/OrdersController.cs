using Microsoft.AspNetCore.Mvc;

namespace NHAGIAKIM.Controllers
{
    public class OrdersController : Controller
    {
        [HttpGet]
        public IActionResult Create()
        {
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult Create(object model)
        {
            // Tạm thời xử lý khi người dùng submit đơn hàng
            return View();
        }
    }
}
