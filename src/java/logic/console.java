package logic;

public class console {
    public static void log(String a) {
        System.out.println(a);
    }
    public static void log(Board a) {
        System.out.println(a);
    }
    public static void cls() {
        System.out.print("\033[H\033[2J");  
        System.out.flush();  
    }
}